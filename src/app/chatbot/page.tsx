import ChatInterface from '@/components/chatbot/ChatInterface';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BotMessageSquare } from 'lucide-react';

export default function ChatbotPage() {
  return (
    <div className="container mx-auto py-8">
       <div className="max-w-3xl mx-auto">
        <Card className="shadow-xl min-h-[70vh] flex flex-col">
          <CardHeader className="text-center border-b">
            <div className="flex justify-center mb-3">
                <BotMessageSquare className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="font-headline text-3xl">河內旅行助手</CardTitle>
            <CardDescription className="text-md">
              問我任何關於河內旅遊的問題！我可以幫助解答關於景點、美食、交通等常見問題。
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col p-0">
            <ChatInterface />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
