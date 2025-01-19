import { useEffect, useRef, useState } from "react"

import { useChat } from "ai/react"

import { useAtom } from "jotai"
import {
  ArrowUp,
  BotMessageSquareIcon,
  Mic,
  Paperclip,
  PauseIcon,
  SpeechIcon,
} from "lucide-react"

import {
  avatarAtom,
  chatModeAtom,
  debugAtom,
  inputTextAtom,
  mediaStreamActiveAtom,
  providerModelAtom,
  sessionDataAtom,
} from "@/lib/atoms"

import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Switch } from "../ui/switch"
import { Textarea } from "../ui/textarea"
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip"

export function Chat() {
  const [avatar] = useAtom(avatarAtom)
  const [inputText, setInputText] = useAtom(inputTextAtom)
  const [sessionData] = useAtom(sessionDataAtom)
  const [mediaStreamActive] = useAtom(mediaStreamActiveAtom)
  const [, setDebug] = useAtom(debugAtom)
  const [chatMode, setChatMode] = useAtom(chatModeAtom)
  const [providerModel, setProviderModel] = useAtom(providerModelAtom)
  const [isLoadingChat, setIsLoadingChat] = useState(false)


const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: true,
  };
  const todaysDate = new Date().toLocaleString("en-US", options);

  const initialPrompt = `# Introduction
  You are Diya, a friendly and helpful assistant for a Windows Hackathon, here to assist attendees at a Windows Hackathon. You can help attendees with their questions.
  
  Today is ${todaysDate}. It's important to know so that you do not give outdated information.
  
  ## Instructions
  
  ## Greeting Users
  * Hello, my name is Diya and I'm your virtual assistant for the Windows Hackathon. How can I help you today?
  `;


  const {
    input,
    setInput,
    handleSubmit,
    handleInputChange,
    messages,
    isLoading,
    error,
    stop,
  } = useChat({
    api: '/api/chat',
    body: {
      provider: 'mistral', // Can be changed to 'anthropic', 'groq', or 'mistral'
      temperature: 0.7,
      maxTokens: 4096
    },
    onResponse: (response) => {
      console.log("AI Response:", response)
    },
    onFinish: async () => {
      setIsLoadingChat(false)
    },
    onError: (error) => {
      console.error("Chat error:", error)
      // Add your error handling UI here
    },
    initialMessages: [
      {
        id: "1",
        role: "system",
        content: initialPrompt,
      },
    ],
  })

  async function handleSpeak() {
    if (!avatar.current) {
      setDebug("Avatar API not initialized")
      return
    }

    await avatar.current
      .speak({
        taskRequest: { text: input, sessionId: sessionData?.sessionId },
      })
      .catch((e) => {
        setDebug(e.message)
      })
  }

  const sentenceBuffer = useRef("")
  const processedSentences = useRef(new Set())

  useEffect(() => {
    const lastMsg = messages[messages.length - 1]

    if (lastMsg.role === "assistant" && lastMsg.content) {
      // Update buffer with the latest message content
      sentenceBuffer.current += ` ${lastMsg.content}`.trim()

      // Split by sentence-ending punctuation
      const sentences = sentenceBuffer.current.split(/(?<=[.!?])/)

      // Process sentences
      sentences.forEach((sentence) => {
        const trimmedSentence = sentence.trim()
        if (
          trimmedSentence &&
          /[.!?]$/.test(trimmedSentence) &&
          !processedSentences.current.has(trimmedSentence)
        ) {
          console.log("Complete Sentence:", trimmedSentence)
          processedSentences.current.add(trimmedSentence) // Mark as logged

          avatar.current!.speak({
            taskRequest: {
              text: trimmedSentence,
              sessionId: sessionData?.sessionId,
            },
          })
        }
      })

      sentenceBuffer.current = "" // Reset buffer after processing
    }
  }, [messages])

  async function handleInterrupt() {
    if (!avatar.current) {
      setDebug("Avatar API not initialized")
      return
    }
    stop()
    await avatar.current
      .interrupt({ interruptRequest: { sessionId: sessionData?.sessionId } })
      .catch((e) => {
        setDebug(e.message)
      })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-2 flex w-full items-center justify-end space-x-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Label
              htmlFor="chat-mode"
              className="flex flex-row items-center space-x-1"
            >
              <SpeechIcon className="size-5" />
              <p>Repeat</p>
            </Label>
          </TooltipTrigger>
          <TooltipContent side="top">Repeat the input text</TooltipContent>
        </Tooltip>

        <Switch
          id="chat-mode"
          className="data-[state=unchecked]:bg-primary"
          defaultChecked={chatMode}
          onCheckedChange={() => setChatMode(!chatMode)}
        />

        <Tooltip>
          <TooltipTrigger asChild>
            <Label
              htmlFor="chat-mode"
              className="flex flex-row items-center space-x-1"
            >
              <p>Chat</p>
              <BotMessageSquareIcon className="size-5" />
            </Label>
          </TooltipTrigger>
          <TooltipContent side="top">Chat</TooltipContent>
        </Tooltip>
      </div>

      <div className="flex w-full items-center">
        <div className="bg-default flex w-full flex-col gap-1.5 rounded-[26px] border bg-background p-1.5 transition-colors">
          <div className="flex items-center gap-1.5 md:gap-2">
            <div className="flex flex-col">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                  >
                    <Paperclip className="size-5" />
                    <Input multiple={false} type="file" className="hidden" />
                    <span className="sr-only">Attach file</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Attach File</TooltipContent>
              </Tooltip>
            </div>

            <div className="flex min-w-0 flex-1 flex-col">
              <Textarea
                id="prompt-textarea"
                data-id="root"
                name="prompt"
                value={input}
                onChange={handleInputChange}
                dir="auto"
                rows={1}
                className="h-[40px] min-h-[40px] resize-none overflow-y-hidden rounded-none border-0 px-0 shadow-none focus:ring-0 focus-visible:ring-0"
              />
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                >
                  <Mic className="size-5" />
                  <span className="sr-only">Use Microphone</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Use Microphone</TooltipContent>
            </Tooltip>

            <Button
              // disabled={!isLoading}
              size="icon"
              type="button"
              className="rounded-full"
              onClick={handleInterrupt}
            >
              <PauseIcon className="size-5" />
            </Button>

            <Button
              // disabled={!isLoading}
              size="icon"
              type={chatMode ? "submit" : "button"}
              className="rounded-full"
              onClick={() => {
                if (!chatMode) {
                  handleSpeak()
                }
              }}
            >
              <ArrowUp className="size-5" />
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
