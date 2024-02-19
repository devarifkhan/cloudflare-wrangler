import { Hono } from "hono";
import { Client, fql, ServiceError } from "fauna";
import { Lucia } from "lucia";
import { MongodbAdapter } from "@lucia-auth/adapter-mongodb";
import { connect } from "mongoose";

connect("mongodb://localhost:27017", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then((e) => {
    console.log("Connected to DB");
  })
  .catch((e) => {
    console.log(e);
  });

// type Bindings = {
//   FAUNA_SECRET: string;
// };

// type Variables = {
//   faunaClient: Client;
// };

// type RegisterForm = {
//   id: string;
//   paymentMethod: string;
//   transaction: string;
//   name: string;
//   email: string;
//   number: string;
//   schoolName: string;
//   schoolBranch: string;
//   division: string;
//   district: string;
//   upazila: string;
//   group: string;
//   referal: string;
//   approved: boolean;
// };

// type Register = {
//   id:string,
//   email: string,
//   password:string
// }

// const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();
const app = new Hono();

app.use("*", async (c, next) => {
  const faunaClient = new Client({
    secret: c.env.FAUNA_SECRET,
  });
  c.set("faunaClient", faunaClient);
  await next();
});

app.get("/", (c) => {
  return c.text("Hello World");
});

app.post("/registerform", async (c) => {
  const {
    paymentMethod,
    transaction,
    name,
    email,
    number,
    schoolName,
    schoolBranch,
    division,
    district,
    upazila,
    group,
    referal,
    approved,
  } = await c.req.json();
  const query = fql`RegisterForm.create({
    paymentMethod: ${paymentMethod},
    transaction: ${transaction},
    name: ${name},
    email: ${email},
    number: ${number},
    schoolName: ${schoolName},
    schoolBranch: ${schoolBranch},
    division: ${division},
    district: ${district},
    upazila: ${upazila},
    group: ${group},
    referal: ${referal},
    approved: ${approved}
  })`;
  const result = (await c.var.faunaClient.query) < RegisterForm > query;
  return c.json({ registration: result.data });
});

app.get("/registrations/:id", async (c) => {
  const id = c.req.param("id");
  const query = fql`RegisterForm.byId(${id})`;
  const result = (await c.var.faunaClient.query) < RegisterForm > query;
  return c.json(result.data);
});

app.post("/register", async (c) => {
  const { email, password } = await c.req.json();
  const query = fql`Register.create({
    email: ${email},
    password: ${password}
  })`;

  const result = (await c.var.faunaClient.query) < RegisterForm > query;
  return c.json({ registration: result.data });
});

await mongoose.connect();

const User = mongoose.model(
  "User",
  new mongoose.Schema(
    {
      _id: {
        type: String,
        required: true,
      },
    },
    { _id: false }
  )
);

const Session = mongoose.model(
  "Session",
  new mongoose.Schema(
    {
      _id: {
        type: String,
        required: true,
      },
      user_id: {
        type: String,
        required: true,
      },
      expires_at: {
        type: Date,
        required: true,
      },
    },
    { _id: false }
  )
);

const adapter = new MongodbAdapter(
  mongoose.connection.collection("sessions"),
  mongoose.connection.collection("users")
);

export default app;
