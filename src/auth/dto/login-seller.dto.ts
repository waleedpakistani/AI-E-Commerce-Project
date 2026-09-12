import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginSellerDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}
