# SmartEstate Backend

## Setup and run
1. clone the [repo](#https://github.com/real-estate-renewalment/backend)
2. make sure you have the following installations: [nodejs](#https://nodejs.org/en), [docker](#https://www.docker.com/products/docker-desktop/) 
3. run `npm install` 
4. run `npm run docker-compose` in the same root directory
5. run the application following the package.json (e.g `npm run start`)

## Working with the application
as you may have noticed we are using a postgres db for this project. it is highly recommended to download [pgAdmin](#https://www.pgadmin.org/) and to have direct access to the db. after running the application navigate over to your local [swagger](#http://localhost:3000/swagger#/) site.  there you can send HTTP requests to the application. feel free to test it out.

## Table of Contents

- [Onion Architecture](#onion-architecture)
- [NestJS](#nestjs)
- [SpecFlow](#specflow)

## Onion Architecture

Onion Architecture is a design pattern for organizing code in a way that emphasizes separation of concerns and maintainability. It consists of multiple concentric layers, with each layer only depending on the inner layers, never on the outer layers. The primary layers in Onion Architecture are:

- Presentation layer: Manages user interfaces, API endpoints, and communication with clients (ingress communication) we will organize those in the 01_API folder.
- Infrastructure Layer: Handles external systems, data access, and third-party libraries (egress communication) we will organize those in the 02_Infrastructure folder.
- ApplicationCore Layer: Manages application services, workflows, use cases, domain entities and business logic, we will organize those in the 03_ApplicationCore folder.

In this template, we have implemented Onion Architecture using NestJS' powerful module system.

## NestJS

NestJS is a progressive Node.js framework that makes it easy to build efficient, reliable, and scalable server-side applications. It's built with TypeScript and combines the best concepts of both Object-Oriented Programming (OOP) and Functional Programming (FP). Some of its features include Dependency Injection, an extensible module system, and decorators. It is highly recommended to read the [docs](#https://docs.nestjs.com/) 

## SpecFlow

SpecFlow is a tool for writing tests using the Gherkin language, which encourages a Behavior Driven Development (BDD) approach. Although SpecFlow is not directly integrated with NestJS, you can use Cucumber.js, a Gherkin-based testing framework, to achieve similar results.

Create a feature file with the desired scenarios:

```gherkin
# tests\Integration\Features\app.e2e.feature
Feature: test Example scenario
    Scenario: execute test
        Given I register new key
            | Email | <Email> |
            | Key   | <Key>   |
            | Value | <Value> |
        When I get all keys
        Then I should see the new key
            | Key   | Value   |
            | <Key> | <Value> |

        Examples:
            | Email              | Key      | Value      |
            | example@gmail.com  | testKey  | testValue  |
            | example1@gmail.com | testKey1 | testValue1 |
            | example2@gmail.com | testKey2 | testValue2 |
```

Now, implement the step definitions using NestJS and Cucumber.js:

```typescript
// tests\Integration\StepDefinitions\fixture.steps.ts
import { Given, Then, When, World } from '@cucumber/cucumber';
import * as request from 'supertest';
import { expect } from 'chai';
import {
  AddExampleRequest,
  AddExampleResponse,
} from '../../../src/API/REST/RestModels/exampleController.Models';

Given('I register new key', async function (this: World, dataTable) {
  const rowHash = dataTable.rowsHash();

  const req: AddExampleRequest = {
    email: rowHash.Email,
    key: rowHash.Key,
    value: rowHash.Value,
  } as AddExampleRequest;
  const res = await request(this.parameters.app.getHttpServer())
    .post('/Example')
    .send(req)
    .expect(201);
});

When('I get all keys', async function (this: World) {
  // ... use usersService to create the user and store the result in createdUser
});

Then('I should see the new key', async function (this: World, dataTable) {
  // ... assert that createdUser has the expected properties and values
});
```

## Commands

`npm run build`: Uses the Nest CLI to build the project. It compiles your TypeScript code into JavaScript.

`npm run start`: `nest start`: Starts your application using the Nest CLI.

`npm run start:dev`: Starts your application in watch mode, the app will automatically restart if it detects any
changes in your source code.

`npm run start:debug`: Starts your application in debug mode with automatic restart on file changes.

`npm run lint`: This command uses ESLint to analyze your code and automatically fix any issues it finds (when possible).

`npm run test`: This command runs your unit tests using Jest.

`npm run test:e2e`: This command runs your end-to-end tests using Cucumber.js.
