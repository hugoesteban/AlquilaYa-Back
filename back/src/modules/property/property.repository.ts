import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Property } from 'src/entities/property.entity';
import { Repository } from 'typeorm';
import { CreatePropertyDto } from './dto/create-property.dto';
import { default as data } from '../../../src/utils/dataProperty.json';
import { UsersRepository } from '../users/users.repository';
import { User } from 'src/entities/user.entity';
import { IPropertyWithUserId } from './interface/propertyWithUserId';
import { format, addDays, isBefore, parse } from 'date-fns';
import { disableDayDto } from './dto/disableday.dto';

@Injectable()
export class PropertyRepository {
  constructor(
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
    private readonly userRepository: UsersRepository,
  ) {}

  async getAllPropertiesRepository(page = 1, limit = 50):Promise<IPropertyWithUserId[]>{
    const properties = await this.propertyRepository.find({
      skip: (page - 1) * limit,
      take: limit,
      relations: {
        specialprice: true,
        user: true
      },
    });

    const propertiesWithUserId = properties.map(property => {
      const { user, ...restProperty } = property;
      return {
        ...restProperty,
        user: { id: user.id }, 
      };
    });
    
    return propertiesWithUserId
  }

  async getPropertyById(id:string):Promise<IPropertyWithUserId>{
    const property = await this.propertyRepository.findOne({where:{id},relations:{user:true}}) 
    if(!property) throw new BadRequestException("Property Id not found")
    const {user,...restProperty} = property
    return{
      ...restProperty,
      user:{id: user.id}
    }
  }

  async createProperty(newProperty: CreatePropertyDto, id: string){
    const propertyExits: Property = await this.propertyRepository.findOne({
      where: { address: newProperty.address },
    });
    if (propertyExits) throw new BadRequestException('Address already used');

    const userDb: Omit<User, 'password'> =
      await this.userRepository.getUserById(id);
    if (!userDb) throw new BadRequestException('user id not found');

    const createProperty: Property = await this.propertyRepository.create({
      user: userDb,
      ...newProperty,
    });
    const savedProperty = await this.propertyRepository.save(createProperty);

    const property: Property = await this.propertyRepository.findOne({
      where: { id: savedProperty.id },
    });

    return { success: 'Property has been added', property:{property,userId: userDb.id} };
  }

  async addPropertiesRepository() {
    const users = await this.userRepository.getAllUsers();
    if (!users) throw new BadRequestException('users not found');
    let j = 0;

    for (let i = 0; i < data.length; i++) {
      if (j == users.length) j = 0;
      this.createProperty(data[i], users[j].id);
      j++;
    }


    return { success: 'properties has been added' };
  }

  async addDisablesDayRepository(propertyId: string,dates:disableDayDto) {
    const property: Property = await this.propertyRepository.findOne({ where: { id: propertyId } });
    if (!property) throw new BadRequestException("Property not found");

    const { dateStart, dateEnd } = dates;
    const startDate = parse(dateStart, "dd/MM/yyyy", new Date());
    const endDate = parse(dateEnd, "dd/MM/yyyy", new Date());

    const today = new Date();

    // Validar si dateStart es una fecha anterior a hoy
    if (isBefore(startDate, today) || isBefore(endDate, startDate)) throw new BadRequestException("Invalid dates");


    let current = startDate;
    const disableDaysArray: string[] = [];


    // Generar fechas en el rango y verificar si ya están reservadas
    while (isBefore(current, endDate) || current.getTime() === endDate.getTime()) {
        const formattedDate = format(current, "dd/MM/yyyy");

        if (property.disableDays.includes(formattedDate)) {
            throw new BadRequestException("Dates are reserved, please take other ones");
        }

        disableDaysArray.push(formattedDate);
        current = addDays(current, 1);
    }

    // Actualizar disableDays
    property.disableDays = [...property.disableDays, ...disableDaysArray];
    await this.propertyRepository.save(property);

    return {success:"The days are reserved now"}

  }
}

