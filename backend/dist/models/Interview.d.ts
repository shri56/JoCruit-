import mongoose from 'mongoose';
import { IInterview } from '@/types';
export declare const Interview: mongoose.Model<IInterview, {}, {}, {}, mongoose.Document<unknown, {}, IInterview, {}, {}> & IInterview & Required<{
    _id: string;
}> & {
    __v: number;
}, any>;
