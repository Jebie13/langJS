

import { OpenAI } from "langchain/llms/openai";
import { SqlDatabase } from "langchain/sql_db";
import { createSqlAgent, SqlToolkit } from "langchain/agents";
import { DataSource } from "typeorm";

import * as dotenv from "dotenv";
dotenv.config();



const run = async()=> {
    const datasource= new DataSource({
        type:"sqlite",
        database:"Chinook.db"
       
    });
const db= await SqlDatabase.fromDataSourceParams({
    appDataSource: datasource,
});
const toolkit = new SqlToolkit(db);
const model = new OpenAI({
    openAIApiKey: process.env.OpenAI_API_KEY,
    temperature: 0
})
const executor = createSqlAgent(model, toolkit);

const input = `show the total sales of USA`;
console.log(`executing with input "${input}"`);


const result= await executor.call({input});

console.log(
    `Got intermediate steps ${JSON.stringify(
        result.intermediateSteps,
        null,
        2
    )}`
);
await datasource.destroy();

};
await run();
// async function main() {
//     const userInput = process.argv[2]; // Get the user's input from the command line
  
//     if (!userInput) {
//       console.error('Please provide an SQL query as a command-line argument.');
//       process.exit(1);
//     }
  
//     const executor = createSqlAgent(model, toolkit);
//     console.log(`Executing with input "${userInput}"`);
  
//     try {
//       const result = await executor.call({ input: userInput });
  
//       console.log(`Got intermediate steps ${JSON.stringify(result.intermediateSteps, null, 2)}`);
//     } catch (error) {
//       console.error('An error occurred:', error);
//     }
//   }
  
 
// };
// await run();