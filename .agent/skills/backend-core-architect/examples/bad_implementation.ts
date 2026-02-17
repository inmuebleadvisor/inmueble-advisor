// @ts-nocheck
// This is a BAD implementation example
// It mimics a file in the 'core' layer importing from 'infrastructure'

import { UserRepository } from '../../infrastructure/repositories/UserRepository'; // VIOLATION!
import * as admin from 'firebase-admin'; // VIOLATION!
import { Request, Response } from 'express'; // VIOLATION!

export class CreateUser {
    constructor(private repo: UserRepository) { }

    async execute(req: Request, res: Response) {
        const user = await this.repo.save(req.body);
        return res.json(user);
    }
}
