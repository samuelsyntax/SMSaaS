import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty({ example: 'admin@school.com' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: 'password123' })
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password: string;
}

export class RefreshTokenDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    refreshToken: string;
}

export class ChangePasswordDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    currentPassword: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    newPassword: string;
}
