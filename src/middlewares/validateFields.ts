import { Request, Response, NextFunction } from 'express';
import {
  validationResult,
  FieldValidationError
} from 'express-validator';

export const validateFields = (req: Request, res: Response, next: NextFunction) => {
  const result = validationResult(req);

  if (!result.isEmpty()) {
    const errors = result.array().map(err => {
      const e = err as FieldValidationError;
      return {
        field: e.path,   
        msg: e.msg
      };
    });

    return res.status(400).json({
      ok: false,
      errors
    });
  }

  next();
};
