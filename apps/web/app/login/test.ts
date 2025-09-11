"use server";

import { getServerSession } from "next-auth";

export const hello = async () => {
  const user = await getServerSession();
  console.log(user);
  return "Hello, world!";
};
