// @ts-nocheck
// This is a GOOD implementation example
// It mimics a file in the 'core' layer importing only from allowed sources

import { User } from './entities/User';
import { IUserRepository } from './repositories/IUserRepository';
import { CreateUserDTO } from '../../shared-kernel/dtos/CreateUserDTO';
// types and shared-kernel are allowed in core

export class CreateUser {
    constructor(private repo: IUserRepository) { }

    async execute(dto: CreateUserDTO): Promise<User> {
        const user = new User(dto);
        return await this.repo.save(user);
    }
}
