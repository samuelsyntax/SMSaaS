import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth & Users (e2e)', () => {
    let app: INestApplication;
    let superAdminToken: string;
    let schoolAdminToken: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe());
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    it('/auth/login (POST) - Super Admin', async () => {
        const response = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'superadmin@sms.com', password: 'admin123' })
            .expect(200);

        expect(response.body).toHaveProperty('accessToken');
        expect(response.body).toHaveProperty('user');
        expect(response.body.user.role).toBe('SUPER_ADMIN');
        superAdminToken = response.body.accessToken;
    });

    it('/auth/login (POST) - School Admin', async () => {
        const response = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'admin@demoschool.edu', password: 'admin123' })
            .expect(200);

        expect(response.body).toHaveProperty('accessToken');
        expect(response.body).toHaveProperty('user');
        expect(response.body.user.role).toBe('SCHOOL_ADMIN');
        schoolAdminToken = response.body.accessToken;
    });

    it('/auth/profile (GET) - Verify Token', async () => {
        await request(app.getHttpServer())
            .get('/auth/profile')
            .set('Authorization', `Bearer ${superAdminToken}`)
            .expect(200);
    });

    // Users Controller Tests
    it('/users (GET) - Super Admin can list users', async () => {
        const response = await request(app.getHttpServer())
            .get('/users')
            .set('Authorization', `Bearer ${superAdminToken}`)
            .expect(200);

        expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('/users (GET) - Unauthorized without token', async () => {
        await request(app.getHttpServer())
            .get('/users')
            .expect(401);
    });
});
