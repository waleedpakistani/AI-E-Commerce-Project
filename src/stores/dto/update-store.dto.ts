import {
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
  Matches,
  IsIn,
} from 'class-validator';

export class UpdateStoreDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Store name must be at least 2 characters long' })
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must contain only lowercase alphanumeric characters and hyphens',
  })
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Logo URL must be a valid URL' })
  logoUrl?: string;

  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE'], {
    message: 'Status must be either ACTIVE or INACTIVE',
  })
  status?: string;
}
