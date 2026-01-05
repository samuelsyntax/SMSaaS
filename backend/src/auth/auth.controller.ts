import {
    Controller,
    Post,
    Body,
    HttpCode,
    HttpStatus,
    UseGuards,
    Get,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto, ChangePasswordDto } from './dto';
import { Public, CurrentUser } from '../common/decorators';
import { JwtAuthGuard } from './jwt-auth.guard';
import { TokenResponse, AuthenticatedUser } from '../common/types';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'User login' })
    async login(@Body() dto: LoginDto): Promise<TokenResponse> {
        return this.authService.login(dto);
    }

    @Public()
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Refresh access token' })
    async refreshToken(@Body() dto: RefreshTokenDto): Promise<TokenResponse> {
        return this.authService.refreshToken(dto.refreshToken);
    }

    @UseGuards(JwtAuthGuard)
    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'User logout' })
    async logout(@CurrentUser('id') userId: string): Promise<{ message: string }> {
        await this.authService.logout(userId);
        return { message: 'Logged out successfully' };
    }

    @UseGuards(JwtAuthGuard)
    @Post('change-password')
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Change password' })
    async changePassword(
        @CurrentUser('id') userId: string,
        @Body() dto: ChangePasswordDto,
    ): Promise<{ message: string }> {
        return this.authService.changePassword(userId, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user profile' })
    async getProfile(@CurrentUser('id') userId: string): Promise<AuthenticatedUser> {
        return this.authService.getProfile(userId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current authenticated user' })
    async me(@CurrentUser() user: AuthenticatedUser): Promise<AuthenticatedUser> {
        return user;
    }
}
