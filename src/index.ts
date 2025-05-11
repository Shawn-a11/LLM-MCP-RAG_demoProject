import ChatOpenAi from './ChatOpenAi'
import MCPClient from './MCPClient'
import Agent from './Agent'
import { EmbeddingRetrievers } from './embeddingRetrievers'
import fs from 'fs'
import path from 'path'
import { logTitle } from './utils'
// async function main() {
//     const fetchMcp = new MCPClient('fetch','uvx',['mcp-server-fetch'])
//     await fetchMcp.init()
//     const tools = fetchMcp.getTools()
//     console.log(tools)
//     await fetchMcp.close()
// }
const currentDir = process.cwd()
const fetchMcp = new MCPClient('fetch','uvx',['mcp-server-fetch'])
const fileMcp = new MCPClient('file','npx',["-y",'@modelcontextprotocol/server-filesystem',currentDir]);

async function main(){
    const prompt = 'demand_prompt'
    const context = await retrieveContext(prompt)
    const agent = new Agent('openai/gpt-4o-mini', [fetchMcp,fileMcp], '', context)
    await agent.init()
    const response = await agent.invoke(prompt)
    console.log(response)
    await agent.close()
}

async function retrieveContext(prompt:string) {
    const embeddingRetriever = new EmbeddingRetrievers('openai/text-embedding-3-small')
    const knowledgeDir = path.join(process.cwd(),'knowledge')
    const files = fs.readdirSync(knowledgeDir)
    for (const file of files) {
        const filePath = path.join(knowledgeDir,file)
        const content = fs.readFileSync(filePath,'utf-8')
        await embeddingRetriever.embedDocument(content)
    }
    const context = await embeddingRetriever.retrieve(prompt)
    logTitle('Context')
    console.log(context)
    return context.map(item => item.document).join('\n')
}

main()