import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SchoolsModule } from './schools/schools.module';
import { StudentsModule } from './students/students.module';
import { TeachersModule } from './teachers/teachers.module';
import { ClassesModule } from './classes/classes.module';
import { SubjectsModule } from './subjects/subjects.module';
import { EnrollmentModule } from './enrollment/enrollment.module';
import { AttendanceModule } from './attendance/attendance.module';
import { ExamsModule } from './exams/exams.module';
import { GradesModule } from './grades/grades.module';
import { FeesModule } from './fees/fees.module';
import { PaymentsModule } from './payments/payments.module';
import { ReportsModule } from './reports/reports.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        PrismaModule,
        AuthModule,
        UsersModule,
        SchoolsModule,
        StudentsModule,
        TeachersModule,
        ClassesModule,
        SubjectsModule,
        EnrollmentModule,
        AttendanceModule,
        ExamsModule,
        GradesModule,
        FeesModule,
        PaymentsModule,
        ReportsModule,
    ],
})
export class AppModule { }
