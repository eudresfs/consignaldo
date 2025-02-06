import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Consignaldo",
      version: "1.0.0",
      description: "Documentação da API Consignaldo"
    },
    servers: [
      { url: "http://localhost:3000" }
    ]
  },
  apis: ["./src/routes/*.ts", "./src/controllers/*.ts"]
};

export const swaggerSpec = swaggerJsdoc(options); 