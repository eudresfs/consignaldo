import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AxePuppeteer } from '@axe-core/puppeteer';
import * as puppeteer from 'puppeteer';

describe('Testes de Acessibilidade', () => {
  let app: INestApplication;
  let browser: puppeteer.Browser;
  let page: puppeteer.Page;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox'],
    });
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
    await app.close();
  });

  describe('Dashboard', () => {
    it('deve seguir diretrizes WCAG 2.1', async () => {
      await page.goto('http://localhost:3000/dashboard');
      const results = await new AxePuppeteer(page).analyze();
      expect(results.violations).toHaveLength(0);
    });

    it('deve ter contraste adequado', async () => {
      await page.goto('http://localhost:3000/dashboard');
      const results = await new AxePuppeteer(page).analyze();
      
      const contrastIssues = results.violations.filter(
        v => v.id === 'color-contrast'
      );
      expect(contrastIssues).toHaveLength(0);
    });

    it('deve ter textos alternativos em imagens', async () => {
      await page.goto('http://localhost:3000/dashboard');
      const images = await page.$$eval('img', imgs => 
        imgs.map(img => ({
          alt: img.alt,
          src: img.src,
        }))
      );

      images.forEach(img => {
        expect(img.alt).toBeTruthy();
      });
    });
  });

  describe('Formulários', () => {
    it('deve ter labels associados aos campos', async () => {
      await page.goto('http://localhost:3000/loan/new');
      const results = await new AxePuppeteer(page).analyze();
      
      const labelIssues = results.violations.filter(
        v => v.id === 'label'
      );
      expect(labelIssues).toHaveLength(0);
    });

    it('deve ter mensagens de erro acessíveis', async () => {
      await page.goto('http://localhost:3000/loan/new');
      
      // Submete formulário vazio
      await page.click('button[type="submit"]');
      
      const errors = await page.$$eval('[role="alert"]', alerts =>
        alerts.map(alert => ({
          text: alert.textContent,
          role: alert.getAttribute('role'),
        }))
      );

      errors.forEach(error => {
        expect(error.role).toBe('alert');
        expect(error.text).toBeTruthy();
      });
    });
  });

  describe('Navegação', () => {
    it('deve ser navegável por teclado', async () => {
      await page.goto('http://localhost:3000');
      
      // Simula navegação por tab
      await page.keyboard.press('Tab');
      
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        return {
          tagName: el.tagName,
          tabIndex: el.tabIndex,
        };
      });

      expect(focusedElement.tabIndex).toBeGreaterThanOrEqual(0);
    });

    it('deve ter skip links', async () => {
      await page.goto('http://localhost:3000');
      
      const skipLinks = await page.$$('[href^="#main"]');
      expect(skipLinks.length).toBeGreaterThan(0);
    });
  });

  describe('Aria Landmarks', () => {
    it('deve ter landmarks apropriadas', async () => {
      await page.goto('http://localhost:3000');
      
      const landmarks = await page.$$eval('[role]', elements =>
        elements.map(el => el.getAttribute('role'))
      );

      expect(landmarks).toContain('banner');
      expect(landmarks).toContain('main');
      expect(landmarks).toContain('navigation');
    });

    it('deve ter cabeçalhos em ordem lógica', async () => {
      await page.goto('http://localhost:3000');
      
      const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', elements =>
        elements.map(el => ({
          level: parseInt(el.tagName.substring(1)),
          text: el.textContent,
        }))
      );

      let previousLevel = 0;
      headings.forEach(heading => {
        expect(heading.level).toBeLessThanOrEqual(previousLevel + 1);
        previousLevel = heading.level;
      });
    });
  });
});
