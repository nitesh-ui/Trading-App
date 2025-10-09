import { NativeEventEmitter, NativeModule, NativeModulesStatic } from 'react-native';

// Create a dummy native module since NativeEventEmitter requires one
const dummyNativeModule: NativeModule = {
  addListener: () => {},
  removeListeners: () => {},
};

class NavigationEvents {
  private static instance: NavigationEvents;
  private eventEmitter: NativeEventEmitter;

  private constructor() {
    this.eventEmitter = new NativeEventEmitter(dummyNativeModule);
  }

  public static getInstance(): NavigationEvents {
    if (!NavigationEvents.instance) {
      NavigationEvents.instance = new NavigationEvents();
    }
    return NavigationEvents.instance;
  }

  public emit(eventName: string) {
    this.eventEmitter.emit(eventName);
  }

  public addListener(eventName: string, callback: () => void) {
    return this.eventEmitter.addListener(eventName, callback);
  }
}

export const navigationEvents = NavigationEvents.getInstance();