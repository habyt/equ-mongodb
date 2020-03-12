import { EQUError } from "@equ-lang/parser"

export class MongoConversionError extends EQUError {
    constructor(msg?: string) {
        super(msg)
    }
}
