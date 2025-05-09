

import { Container } from "@azure/cosmos";
import { Knowledge } from "../types";
import { getContainer } from "./utils";



export const KNOWLEDGE_CONTAINER_ID = "knowledge";

let knowledgeContainer: Container;

const embeddingPaths: (keyof Knowledge)[] = ["summaryEmbedding"];

export const getKnowledgeContainer = async () => {
    if (!knowledgeContainer) knowledgeContainer = await getContainer<Knowledge>(KNOWLEDGE_CONTAINER_ID, "baseUrl", { embeddingPaths });
    return knowledgeContainer;
};