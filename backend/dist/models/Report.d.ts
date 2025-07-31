import mongoose from 'mongoose';
import { IReport } from '@/types';
export declare const Report: mongoose.Model<IReport, {}, {}, {}, mongoose.Document<unknown, {}, IReport, {}, {}> & IReport & Required<{
    _id: string;
}> & {
    __v: number;
}, any>;
