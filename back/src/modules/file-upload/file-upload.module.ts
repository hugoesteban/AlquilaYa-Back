import { Module } from '@nestjs/common';
import { FileUploadService } from './file-upload.service';
import { FileUploadController } from './file-upload.controller';
import { Property } from 'src/entities/property.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CloudinaryConfig } from '../../config/cloudinary';
import { FileUploadRespository } from './file-upload.repository';
import { PropertyService } from '../property/property.service';
import { PropertyRepository } from '../property/property.repository';
import { UsersRepository } from '../users/users.repository';
import { User } from 'src/entities/user.entity';
import { EmailService } from '../email/email.service';
import { EmailRepository } from '../email/email.repository';
import { Email } from 'src/entities/email.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Property, User,Email])],
  controllers: [FileUploadController],
  providers: [FileUploadService, CloudinaryConfig, FileUploadRespository, PropertyService, PropertyRepository, UsersRepository, EmailService,EmailRepository],
  exports: [FileUploadService],
})
export class FileUploadModule {}
