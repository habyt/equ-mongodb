import { FilterQuery } from "mongodb"
import {
    ParseItem,
    FilterOperand,
    FilterOperator,
    ExpressionOperator,
    ExpressionItem,
    parse
} from "@equ-lang/parser"

export class MongoConversionError extends Error {
    constructor(msg?: string) {
        super(msg)
    }
}

function mongoError(msg?: string): never {
    throw new MongoConversionError(msg)
}

function convertOperator<TSchema>(
    item: FilterOperator,
    input: Array<ParseItem>
): FilterQuery<TSchema> {
    const op1 = convertOperand(input.pop() ?? mongoError(), input)
    const op2 = convertOperand(input.pop() ?? mongoError(), input)

    if (item.operator === "and") {
        return { $and: [op1, op2] } as FilterQuery<TSchema>
    }

    if (item.operator === "or") {
        return { $or: [op1, op2] } as FilterQuery<TSchema>
    }

    mongoError("unsupported operator " + item.operator)
}

function convertOperand<TSchema>(
    item: ParseItem,
    input: Array<ParseItem>
): FilterQuery<TSchema> {
    if (item.type === "operator") {
        return convertOperator(item, input)
    }

    return convertExpressions(item)
}

function convertExpressions<TSchema>(
    item: FilterOperand
): FilterQuery<TSchema> {
    const { path, expressions } = item

    const start = expressions.pop() ?? mongoError("expected expression")

    return convertExpressionOperand(start, path, expressions)
}

function convertExpressionOperator<TSchema>(
    operator: ExpressionOperator,
    path: string,
    expressions: Array<ExpressionItem>
): FilterQuery<TSchema> {
    const op1 = convertExpressionOperand(
        expressions.pop() ?? mongoError("expected expression"),
        path,
        expressions
    )
    const op2 = convertExpressionOperand(
        expressions.pop() ?? mongoError("expected expression"),
        path,
        expressions
    )

    if (operator.operator === "and") {
        return { $and: [op1, op2] } as FilterQuery<TSchema>
    }

    if (operator.operator === "or") {
        return { $or: [op1, op2] } as FilterQuery<TSchema>
    }

    mongoError("unsupported expression operator " + operator.operator)
}

function convertExpressionOperand<TSchema>(
    expression: ExpressionItem,
    path: string,
    expressions: Array<ExpressionItem>
): FilterQuery<TSchema> {
    if (expression.type === "expressionOperator") {
        return convertExpressionOperator(expression, path, expressions)
    }

    switch (expression.expressionType) {
        case "eq": {
            return { [path]: { $eq: expression.value } } as FilterQuery<TSchema>
        }
        case "gt": {
            return { [path]: { $gt: expression.value } } as FilterQuery<TSchema>
        }
        case "gte": {
            return { [path]: { $gte: expression.value } } as FilterQuery<
                TSchema
            >
        }
        case "lt": {
            return { [path]: { $lt: expression.value } } as FilterQuery<TSchema>
        }
        case "lte": {
            return { [path]: { $lte: expression.value } } as FilterQuery<
                TSchema
            >
        }
        case "ct": {
            if (expression.valueType === "number") {
                mongoError(
                    "invalid expression: " +
                        expression.expressionType +
                        " " +
                        expression.value +
                        ". Value is a number but must be string"
                )
            }
            return { [path]: { $regex: expression.value } } as FilterQuery<
                TSchema
            >
        }
        case "rgx": {
            return { [path]: { $regex: expression.value } } as FilterQuery<
                TSchema
            >
        }
        case "neq": {
            return {
                [path]: { $not: { $eq: expression.value } }
            } as FilterQuery<TSchema>
        }
        case "ex": {
            return { [path]: { $exists: expression.value } } as FilterQuery<
                TSchema
            >
        }
        default: {
            mongoError("cannot convert " + expression.expressionType)
        }
    }
}

export function equToMongoDB<TSchema>(equ: string): FilterQuery<TSchema> {
    const result = parse(equ)

    return toMongo(result)
}

function toMongo<TSchema>(input: Array<ParseItem>): FilterQuery<TSchema> {
    const start = input.pop() ?? mongoError("expected something")

    return convertOperand(start, input)
}
