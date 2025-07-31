import mongoose from 'mongoose';
import { IQuestionBank } from '@/types';
export declare const QuestionBank: mongoose.Model<IQuestionBank, {}, {}, {}, mongoose.Document<unknown, {}, IQuestionBank, {}, {}> & IQuestionBank & Required<{
    _id: string;
}> & {
    __v: number;
}, any>;
