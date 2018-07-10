import { validator, validate } from "./experiment";

it("works with basic validators", () => {
  class U {
    @validator() name!: string;
  }
  class C {
    @validator() id!: string;
    @validator() u!: U;
  }

  class Test {
    @validate
    myMethod(params: C) {
      console.log("Got params", params);
    }
  }

  let t = new Test();
  t.myMethod({ id: "1", u: { name: "ok" } });
  expect(() => {
    t.myMethod({ id: "1", u: { name: (1 as any) as string } });
  }).toThrowError("Invalid property u : Invalid property name : not a string");
});

it("works with custom validators", () => {
  class MyParams {
    @validator(
      (email: string) =>
        email.indexOf("@") === -1 ? "invalid email" : undefined
    )
    email!: string;
  }
  class MyService {
    @validate
    myMethod(params: MyParams) {
      console.log("got params", params);
    }
  }
  let service = new MyService();
  expect(() => service.myMethod({ email: "not an email" })).toThrowError(
    "invalid email"
  );
  service.myMethod({ email: "andrej@hfour.com" }); // this should be okay
});
