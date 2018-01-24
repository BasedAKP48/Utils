// Type definitions for Utils
// Project: BasedAKP48
// Definitions by: Austin Peterson <austin@akpwebdesign.com> (https://blog.akpwebdesign.com/)

import { Reference, ThenableReference } from '@firebase/database-types'
import admin from 'firebase-admin'
import EventEmitter from 'events'

type AKP48Message = object | (() => object); // TODO: define this as an interface with the right properties.

declare interface GetCIDOptions {
  /** Firebase Database root */
  root: Reference
  /** Path to CID file. */
  cidPath?: string
  /** Root directory of the plugin. */
  dir?: string
  /** CID file name. */
  file?: string
}

declare interface ModuleOptions {
  type: string
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

declare interface MessagingSystemOptions {
  /** Firebase Database root reference. */
  rootRef: Reference
  /** The client ID to use. */
  cid: string
  /** The mode to listen in. */
  listenMode: string
  /** Whether to delete messages after emitting. */
  deleteAfterEmit: boolean
}

declare interface PresenceSystemOptions {
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

declare namespace Utils {
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
  function getReply(msg: AKP48Message, uid: string, text: string, data: object) : AKP48Message
  
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
  function safeObject(object?: object)

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
     * @param {AKP48Message} msg The message to send.
     */
    sendMessage(msg: AKP48Message) : ThenableReference
  }

  class PresenceSystem extends EventEmitter {
    /** Initialize the presence system. */
    initialize(options: PresenceSystemOptions)
    
    /** Clear all event emitter listeners. TODO: Not yet implemented */
    clearListeners()

    /**
     * Deletes the entire registry entry. Use if you no longer wish to store any information about
     * your plugin.
     */
    remove()

    /** Whether or not the presence system is usable. */
    valid() : boolean
  }
}

export = Utils
