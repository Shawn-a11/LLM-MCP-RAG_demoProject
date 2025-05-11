import { tokenHandler } from '@modelcontextprotocol/sdk/server/auth/handlers/token.js';
import ChatOpenAi from './ChatOpenAi';
import MCPClient from './MCPClient';
import { logTitle } from './utils';

export default class Agent {
    private llm: ChatOpenAi | null = null;
    private mcpClients: MCPClient[];
    private model: string;
    private systemPrompt: string;
    private context: string;

    constructor(model:string,mcpClients:MCPClient[],systemPrompt:string = '',context:string){
        this.mcpClients = mcpClients;
        this.model = model;
        this.systemPrompt = systemPrompt;
        this.context = context;
    }
    public async init(){
        logTitle('Init LLM AND TOOLS')
        this.llm = new ChatOpenAi(this.model,this.systemPrompt)
        for (const mcpClient of this.mcpClients){
            await mcpClient.init()
        }
        const tools = this.mcpClients.flatMap(mcpClient => mcpClient.getTools())
        this.llm = new ChatOpenAi(this.model,this.systemPrompt,tools,this.context)
    }
    public async close(){
        logTitle('Closing LLM AND TOOLS')
        for await (const client of this.mcpClients){
            await client.close()
        }
    }
    async invoke(prompt:string){
        if (!this.llm){
            throw new Error('LLM not initialized')
        }
        let response = await this.llm.chat(prompt)
        while (true){
            if (response.toolCalls.length > 0){
                for(const toolCall of response.toolCalls){
                    const mcp = this.mcpClients.find(mcpClient => mcpClient.getTools().find(t => t.name === toolCall.function.name))
                    if (mcp){
                       logTitle('Tool Use' + toolCall.function.name)
                        console.log('Calling tool: ${toolCall.function.name}')
                       console.log(toolCall.function.arguments)
                        const result = await mcp.callTool(toolCall.function.name,JSON.parse(toolCall.function.arguments))
                        console.log('Result: ${result}')
                        this.llm.appendToolResult(toolCall.id,JSON.stringify(result))
                    }else{
                        this.llm.appendToolResult(toolCall.id,'Tool not found')
                    }
                }
            }
            response = await this.llm.chat()
            continue
        }
        await this.close()
        return response.content
    }  
}