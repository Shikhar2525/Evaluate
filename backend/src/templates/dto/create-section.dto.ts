import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateSectionDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  codeLanguage?: string;

  @IsOptional()
  @IsNumber()
  order?: number;
}
