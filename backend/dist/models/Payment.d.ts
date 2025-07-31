import mongoose from 'mongoose';
import { IPayment } from '@/types';
export declare const Payment: mongoose.Model<IPayment, {}, {}, {}, mongoose.Document<unknown, {}, IPayment, {}, {}> & IPayment & Required<{
    _id: string;
}> & {
    __v: number;
}, any>;
