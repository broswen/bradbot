import {InteractionResponseFlags, InteractionResponseType, InteractionType, verifyKey} from "discord-interactions";
import {CommandRouter, FLIP_COMMAND, INVITE_COMMAND, PING_COMMAND, ROLL_COMMAND} from "./commands";

export interface Interaction {
  id: string,
  application_id: string,
  type: InteractionType,
  data: object,
  guild_id?: string,
  channel_id?: string,
}

export enum CommandType {
  CHAT_INPUT = 1,
  USER = 2,
  MESSAGE = 3,
}

export interface Command {
  id: string,
  type?: CommandType,
  application_id: string,
  name: string,
  options?: CommandOption[]
}

export interface CommandOption {
  name: string,
  value: string
}

const commandRouter = new CommandRouter()
commandRouter.register(PING_COMMAND)
commandRouter.register(INVITE_COMMAND)
commandRouter.register(FLIP_COMMAND)
commandRouter.register(ROLL_COMMAND)

export default {
  async fetch(request: Request, env: Env) {
    //if request is a POST (interaction/webhook) event we should make sure it is authorized and from discord
    if (request.method === 'POST') {
      // Using the incoming headers, verify this request actually came from discord.
      const signature = request.headers.get('x-signature-ed25519') ?? ''
      const timestamp = request.headers.get('x-signature-timestamp') ?? ''
      console.log(signature, timestamp, env.DISCORD_PUBLIC_KEY)
      const body = await request.clone().arrayBuffer();
      const isValidRequest = verifyKey(
          body,
          signature,
          timestamp,
          env.DISCORD_PUBLIC_KEY
      );
      if (!isValidRequest) {
        console.error('Invalid Request')
        return new Response('Bad request signature.', { status: 401 })
      }
      return handleInteraction(request, env)
    }

    //return OK on any other request to confirm the bot is available
    return new Response('OK')
  }
}

async function handleInteraction(request: Request, env: Env): Promise<Response> {
  const message = await request.json<Interaction>();
  //return an ACK if the request is a ping type
  if (message.type === InteractionType.PING) {
    console.log('Handling PING request')
    return new Response(JSON.stringify({type: InteractionResponseType.PONG}))
  }

  //route command to command router
  if (message.type === InteractionType.APPLICATION_COMMAND) {
    const command = message.data as Command
    console.log(command)

    return commandRouter.handle(command, env)
  }

  return new Response('bad request', {status: 400})
}

//secrets for verifying discord stuff
export interface Env {
  DISCORD_TOKEN: string,
  DISCORD_PUBLIC_KEY: string,
  DISCORD_APPLICATION_ID: string,
}