export interface VectorStoreItem {
    embedding: number[],
    document: string
}

export default class VectorStore {
    private vectorStore: VectorStoreItem[]; 

    constructor() {
        this.vectorStore = []
    }
    async add(item: VectorStoreItem) {
        this.vectorStore.push(item)
    }
    async search(queryEmbedding: number[], topK: number = 3) {
        const scored = this.vectorStore.map(item => ({
            document: item.document,
            score: this.cosineSimilarity(item.embedding,queryEmbedding)
        }))
        return scored.sort((a,b) => b.score - a.score).slice(0,topK)
    }
    private cosineSimilarity(v1:number[],v2:number[]) {
        const dotProduct = v1.reduce((acc,curr,index) => acc + curr * v2[index],0)
        const magnitude1 = Math.sqrt(v1.reduce((acc,curr) => acc + curr * curr,0))
        const magnitude2 = Math.sqrt(v2.reduce((acc,curr) => acc + curr * curr,0))
        return dotProduct / (magnitude1 * magnitude2)
    }
}
