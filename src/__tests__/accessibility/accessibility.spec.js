"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const app_module_1 = require("../../app.module");
const puppeteer_1 = require("@axe-core/puppeteer");
const puppeteer = __importStar(require("puppeteer"));
describe('Testes de Acessibilidade', () => {
    let app;
    let browser;
    let page;
    beforeAll(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
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
            const results = await new puppeteer_1.AxePuppeteer(page).analyze();
            expect(results.violations).toHaveLength(0);
        });
        it('deve ter contraste adequado', async () => {
            await page.goto('http://localhost:3000/dashboard');
            const results = await new puppeteer_1.AxePuppeteer(page).analyze();
            const contrastIssues = results.violations.filter(v => v.id === 'color-contrast');
            expect(contrastIssues).toHaveLength(0);
        });
        it('deve ter textos alternativos em imagens', async () => {
            await page.goto('http://localhost:3000/dashboard');
            const images = await page.$$eval('img', imgs => imgs.map(img => ({
                alt: img.alt,
                src: img.src,
            })));
            images.forEach(img => {
                expect(img.alt).toBeTruthy();
            });
        });
    });
    describe('Formulários', () => {
        it('deve ter labels associados aos campos', async () => {
            await page.goto('http://localhost:3000/loan/new');
            const results = await new puppeteer_1.AxePuppeteer(page).analyze();
            const labelIssues = results.violations.filter(v => v.id === 'label');
            expect(labelIssues).toHaveLength(0);
        });
        it('deve ter mensagens de erro acessíveis', async () => {
            await page.goto('http://localhost:3000/loan/new');
            // Submete formulário vazio
            await page.click('button[type="submit"]');
            const errors = await page.$$eval('[role="alert"]', alerts => alerts.map(alert => ({
                text: alert.textContent,
                role: alert.getAttribute('role'),
            })));
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
            const landmarks = await page.$$eval('[role]', elements => elements.map(el => el.getAttribute('role')));
            expect(landmarks).toContain('banner');
            expect(landmarks).toContain('main');
            expect(landmarks).toContain('navigation');
        });
        it('deve ter cabeçalhos em ordem lógica', async () => {
            await page.goto('http://localhost:3000');
            const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', elements => elements.map(el => ({
                level: parseInt(el.tagName.substring(1)),
                text: el.textContent,
            })));
            let previousLevel = 0;
            headings.forEach(heading => {
                expect(heading.level).toBeLessThanOrEqual(previousLevel + 1);
                previousLevel = heading.level;
            });
        });
    });
});
