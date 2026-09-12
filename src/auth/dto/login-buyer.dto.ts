import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginBuyerDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
