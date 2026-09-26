import { connection } from "next/server";
import ColourExperience from "./comps/ColourExperience";
import { getRandomColor } from "./utils";

export default async function Home() {
  await connection();
  const initialColour = getRandomColor();

  return <ColourExperience initialColour={initialColour} />;
}
