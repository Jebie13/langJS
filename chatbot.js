import { DataSource } from "typeorm";
import { SqlDatabase } from "langchain/sql_db";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { PromptTemplate } from "langchain/prompts";
import { RunnableSequence } from "langchain/schema/runnable";
import { StringOutputParser } from "langchain/schema/output_parser";

// Set up the database connection
const datasource = new DataSource({
  type: "sqlite",
  database: "Chinook.db",
});

const db = await SqlDatabase.fromDataSourceParams({
  appDataSource: datasource,
});

// Create the language model
const llm = new ChatOpenAI();

// Create the prompt template for getting the SQL query
const prompt = PromptTemplate.fromTemplate(`Based on the provided SQL table schema below, write a SQL query that would answer the user's question.
------------
SCHEMA: {schema}
------------
QUESTION: {question}
------------
SQL QUERY:`);

// Create a RunnableSequence to pipe the output from `db.getTableInfo()` and the user's question into the prompt template and then into the language model
const sqlQueryChain = RunnableSequence.from([
  {
    schema: async () => db.getTableInfo(),
    question: (input) => input.question,
  },
  prompt,
  llm.bind({ stop: ["\nSQLResult:"] }),
  new StringOutputParser(),
]);

// Create the prompt template for getting the natural language response
const finalResponsePrompt = PromptTemplate.fromTemplate(`Based on the table schema below, question, SQL query, and SQL response, write a natural language response:
------------
SCHEMA: {schema}
------------
QUESTION: {question}
------------
SQL QUERY: {query}
------------
SQL RESPONSE: {response}
------------
NATURAL LANGUAGE RESPONSE:`);

// Create a RunnableSequence to pipe the output from the previous chain, the user's question, and the SQL query into the prompt template and then into the language model
const finalChain = RunnableSequence.from([
  {
    question: (input) => input.question,
    query: sqlQueryChain,
  },
  {
    schema: async () => db.getTableInfo(),
    question: (input) => input.question,
    query: (input) => input.query,
    response: (input) => db.run(input.query),
  },
  {
    result: finalResponsePrompt.pipe(llm).pipe(new StringOutputParser()),
    sql: (previousStepResult) => previousStepResult.query,
  },
]);

// Invoke the final chain with the user's question
const finalResponse = await finalChain.invoke({
  question: "How many employees are there?",
});

console.log(finalResponse);