import { equToMongoDB } from "../src/mongo"

const example = `name.first[eq:"foo"|eq:"bar"]|email[ct:"foo",ct:"bar"],age[(gt:4.5,lt:-10)|eq:15]`

describe("equ-mongodb", () => {
    it("should translate the example to a mongodb query", () => {
        const result = equToMongoDB(example)
        expect(result).toMatchSnapshot()
    })

    it("should translate a simple query", () => {
        const result = equToMongoDB("path[eq:1]")
        expect(result).toMatchSnapshot()
    })

    it("should translate a simple gte query", () => {
        const result = equToMongoDB("path[gte:1]")
        expect(result).toMatchSnapshot()
    })

    it("should translate a simple lte query", () => {
        const result = equToMongoDB("path[lte:1]")
        expect(result).toMatchSnapshot()
    })

    it("should throw an error on using contains with a number", () => {
        expect(() => equToMongoDB("path[ct:1]")).toThrowErrorMatchingSnapshot()
    })

    it("should convert a regex expression", () => {
        const result = equToMongoDB("path[rgx:\"as.f\"]")
        expect(result).toMatchSnapshot()
    })

    it("should convert a neq expression", () => {
        const result = equToMongoDB("path[neq:1]")
        expect(result).toMatchSnapshot()
    })

    it("should convert an ex expression", () => {
        const result = equToMongoDB("path[ex:true]")
        console.log(result)
        expect(result).toMatchSnapshot()

        const result2 = equToMongoDB("path[ex:false]")
        console.log(result2)
        expect(result).toMatchSnapshot()
    })
})

