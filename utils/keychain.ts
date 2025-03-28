import * as Keychain from "react-native-keychain";

export const saveKeysToKeychain = async (key:any, iv:any)=> {
    await Keychain.setGenericPassword("aesKey", key);
    await Keychain.setGenericPassword("iv", iv);
} 