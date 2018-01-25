// Type definitions for Utils
// Project: BasedAKP48
// Definitions by: Austin Peterson <austin@akpwebdesign.com> (https://blog.akpwebdesign.com/)

import { Reference, ThenableReference } from '@firebase/database-types'
import admin from 'firebase-admin'
import EventEmitter from 'events'

/** CID of plugin */
declare type CID = string

declare interface AKP48Message {
  /** 
   * Defines the sender of the message
   * @incoming unique ID of user
   * @outgoing cid of plugin
   */
  uid: string
  /** 
   * @incoming cid of connector.
   * @outgoing intended target (set by server)
   */
  cid: CID
  /** Message text */
  text: string
  /** Channel ID */
  channel: string
  /** Type of message received */
  type: string
  /** Time the message was sent */
  timeReceived: number
  /** Extra data the message contains */
  data?: string | object
  /** 
   * Direction of the message. Set by server.
   * 
   * in: A message received from external sources
   * 
   * out: A message sent by a plugin
   */
  direction: 'in' | 'out'
}

declare interface OutgoingMessage extends AKP48Message {
  /** CID of your plugin */
  uid: CID
  /** Use `target` instead */
  cid: never
  /** CID of the plugin receiving the message */
  target: CID
  /** Set by server if unset. Default: Date.now() */
  timeReceived?: number
  /** Default: 'text' */
  type?: string
  /** Direction of the message. Set by server. */
  direction?: 'out'
}

declare interface InternalMessage extends AKP48Message {
  /** CID of the plugin that sent this message. This is your `target`. */
  uid: CID
  /** Your plugins CID */
  cid: CID
  /** This is your `command` */
  text: string
  /** This is your `arg` */
  channel: string
  /** Data received from plugin */
  data: object
  /** This is an internal message */
  type: 'internal'
}

declare namespace Utils {
  type ResponseMessage = {
    /** CID of target plugin */
    target: CID
    /** Command (linked to `text`) */
    command: string
    /** Arguments (linked to `channel`) */
    arg: string
    data?: string | object
  }

  type ResponseOptions = {
    timestamp?: number
  }

  interface GetCIDOptions {
    /** Firebase Database root */
    root: Reference
    /** Path to CID file. */
    cidPath?: string
    /** Root directory of the plugin. */
    dir?: string
    /** CID file name. */
    file?: string
  }

  interface ModuleOptions {
    /**
     * Will be ignored if you construct a "Plugin" or "Connector".
     * 
     * Must be supplied if you extend "Module".
     */
    type: 'Plugin' | 'Connector' | 'Custom'
    /** Name of module (optional). */
    name?: string
    /** Firebase Database root reference (optional). Will attempt to generate if missing. */
    root?: Reference
    /** Firebase service account (optional). Will attempt to load from default location if missing. */
    serviceAccount?: admin.ServiceAccount
    /** CID (optional). Will create from database if missing. */
    cid?: string
    /** CID file path (optional). */
    cidPath?: string
    /** Path to working directory (optional). */
    dir?: string
    /** CID file name (optional). */
    dirFile?: string
    /** An object describing the package.json file (optional). */
    pkg?: object
    /** Listen mode of the plugin module (optional). Defaults to "normal". */
    listenMode?: string
  }

  interface MessagingSystemOptions {
    /** Firebase Database root reference. */
    rootRef: Reference
    /** The client ID to use. */
    cid: string
    /** The mode to listen in. */
    listenMode: string
    /** Whether to delete messages after emitting. */
    deleteAfterEmit: boolean
  }

  interface PresenceSystemOptions {
    /** Firebase Database root reference. */
    rootRef: Reference
    /** The client ID to use. */
    cid: string
    /** An object describing the package.json file. */
    pkg: object
    /** The mode to listen in. */
    listenMode: string
    /** The name of this instance for display to users. */
    instanceName: string
  }

  /**
   * Ensures that all keys are included in an options object.
   * @param {object} options The options to check for required keys in.
   * @param {string[]} required The keys to check for.
   * @return {boolean} Whether or not the required properties exist.
   */
  function ensureRequired(options: object, required: string[]) : boolean

  /**
   * Loads or generates a CID for you.
   * If {@param dir} is null a key will be generated without any I/O access.
   */
  function getCID(options: GetCIDOptions)
  
  /**
   * Prepare a new message based off of an existing message.
   *
   * @param {AKP48Message} msg Message to respond to.
   * @param {string} uid Sender of the message your plugin identifier (usually)
   * @param {string} text Text to include in reply
   * @param {object} [data] data to include in reply
   * @returns {object}
   */
  function getReply(msg: AKP48Message, uid: string, text: string, data: object) : OutgoingMessage
  
  /**
   * Initializes a FirebaseAdmin application.
   * @param {admin} firebase Firebase Admin instance
   * @param {admin.ServiceAccount} serviceAccount Service account file from the Firebase web application
   * @param {string} [appname] Optional name to initialize with.
   */
  function initialize(firebase: admin, serviceAccount: admin.ServiceAccount, appname: string)

  /**
   * Returns a clean object (original or new) ready for storing in Firebase.
   * @param {object} object Potentially unsafe object.
   * @returns {object} Original or new clean object.
   */
  function safeObject(object: object)

  /**
   * Returns a cleaned string ready for use in Firebase.
   * @param {string} string Potentially unsafe string.
   */
  function safeString(string: string)
  
  /** A general Firebase-enabled module. */
  class Module extends EventEmitter {
    constructor(options: ModuleOptions)
    presenceSystem() : PresenceSystem
    messageSystem() : MessagingSystem
    /**
     * Send internal message with given data, returning a Promise that resolves with the internal message.
     */
    response(message: ResponseMessage, options?: ResponseOptions) : Promise<InternalMessage>
    destroyed() : boolean

    on(event: 'config', listener: (config: object, reference: Reference) => void) : this
    on(event: 'destroy', listener: () => void) : this
  }
  
  /** A plugin module. Overrides options.type to "plugin" */
  class Plugin extends Module {
    constructor(options: ModuleOptions)
  }
  
  /**
   * A connector module. Overrides options.type to "connector"
   * and sets options.listenMode to "connector" if not already set.
   */
  class Connector extends Module {
    constructor(options: ModuleOptions)
  }
  
  class MessagingSystem extends EventEmitter {
    /** Initialize the messaging system. */
    initialize(options: MessagingSystemOptions)
    
    /**
     * Reply to a message with simple text.
     * @param {string} text - The text to send.
     * @param {AKP48Message} msg - The message to reply to.
     * @param {object} [data] - data to send (merges over msg.data)
     */
    sendText(text: string, msg: AKP48Message, data: object) : ThenableReference
    
    /**
     * Send a message. The message provided is expected to be a full reply such as one provided by
     * `Utils.getReply()`.
     * @param {OutgoingMessage} msg The message to send.
     */
    sendMessage(msg: OutgoingMessage) : ThenableReference

    /** Clear all event emitter listeners. TODO: Not yet implemented */
    clearListeners()

    /**
     * Deletes the entire registry entry. Use if you no longer wish to store any information about
     * your plugin. TODO: Not yet implemented
     */
    remove()

    /** Called when messages are received from the database */
    on(event: 'message' | 'message/type' | 'message-direction' | 'message-self', listener: (message: AKP48Message, reference: Reference) => void) : this
  }

  class PresenceSystem extends EventEmitter {
    /** Initialize the presence system. */
    initialize(options: PresenceSystemOptions)
    
    /** Clear all event emitter listeners. TODO: Not yet implemented */
    clearListeners()

    /**
     * Deletes the entire registry entry. Use if you no longer wish to store any information about
     * your plugin. TODO: Not yet implemented
     */
    remove()

    /** Whether or not the presence system is usable. */
    valid() : boolean

    on(event: 'connect', listener: () => void) : this
    on(event: 'disconnect', listener: () => void) : this
    on(event: 'status', listener: (status: string) => void) : this
  }
}

export = Utils
