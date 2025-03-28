import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import forge from "node-forge";
import React, { useState, useEffect } from "react";
import { generateAESKeyAndIV, encryptData, decryptData } from './utils/crypto';
import * as Keychain from "react-native-keychain";

export default function App() {
  interface CardDetails {
    cardNumber: string;
    cardHolder: string;
    cardExpiryDate: string;
    cardCVV: string;
  }

  const [ciphertext, setCiphertext] = useState<forge.util.ByteStringBuffer | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [decryptedDetails, setDecryptedDetails] = useState<CardDetails | null>(null);

  const cardDetails = {
    cardNumber: "1234 5678 1234 5678",
    cardHolder: "John Doe",
    cardExpiryDate: "01/23",
    cardCVV: "123",
  };

  useEffect(() => {
    const { aesKey: newKey, iv: newIv } = generateAESKeyAndIV();

    console.log('AES Key (hex):', newKey.toHex());
    console.log('IV (hex):', newIv.toHex());
    saveCredentialsToKeychain(newKey, newIv);
  }, []);

  useEffect(() => {
    const encryption = async () => {
      const credentials = await getCredentialsFromKeychain();
      if (credentials) {
        const aesKeyKeychain = forge.util.createBuffer(forge.util.hexToBytes(credentials.username)); // We need to convert the hex string back to a ByteStringBuffer object.
        const ivKeychain = forge.util.createBuffer(forge.util.hexToBytes(credentials.password)); // We need to convert the hex string back to a ByteStringBuffer object.
        const encrypted = encryptData<CardDetails>(cardDetails, aesKeyKeychain, ivKeychain);
        setCiphertext(encrypted);
        console.log('Encrypted data:', encrypted.toHex());
      }
    };
    encryption();
  }, []);


  const saveCredentialsToKeychain = async (key: forge.util.ByteStringBuffer, iv: forge.util.ByteStringBuffer) => {
    try {
      await Keychain.setGenericPassword(key.toHex(), iv.toHex(),  // We need to pass the key and iv as strings instead of ByteStringBuffer objects.
      {      
        // accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY, // These line code are for the biometric authentication.
        // accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED
      });
      console.log("Credentials saved successfully!");      
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.log("Keychain couldn't be accessed!", error.message);
      } else {
        console.log("Keychain couldn't be accessed!", "An unknown error occurred");
      }
    }
  };

  const getCredentialsFromKeychain = async () => {
    try {
      const credentials = await Keychain.getGenericPassword();
      // const credentials = await Keychain.getGenericPassword({accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY}); // biometric authentication.
      console.log('Credentials retrieved from Keychain:', credentials);
      return credentials;
    }
    catch (error: unknown) {
      if (error instanceof Error) {
        console.log('Error retrieving credentials:', error.message);
      } else {
        console.log('Error retrieving credentials:', 'An unknown error occurred');
      }
    }
  }

  const handleShowDetails = async () => {
    if (!showDetails && ciphertext) {
      try {
        const credentials =  await getCredentialsFromKeychain();

        if (credentials) {
          const aesKeyKeychain = forge.util.createBuffer(forge.util.hexToBytes(credentials.username)); // We need to convert the hex string back to a ByteStringBuffer object.
          const ivKeychain = forge.util.createBuffer(forge.util.hexToBytes(credentials.password)); // We need to convert the hex string back to a ByteStringBuffer object.
          const decrypted = decryptData<CardDetails>(ciphertext, aesKeyKeychain, ivKeychain);
          setDecryptedDetails(decrypted);
          console.log('Decrypted data:', decrypted);     
        }
      } catch (error) {
        console.error('Error decrypting data:', error);
      }
    }
    setShowDetails(!showDetails);
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.cardText}>
          Número de tarjeta:{" "}
          {showDetails && decryptedDetails
            ? decryptedDetails.cardNumber
            : "**** **** **** ****"}
        </Text>
        <Text style={styles.cardText}>
          Titular: {showDetails && decryptedDetails ? decryptedDetails.cardHolder : "***"}
        </Text>
        <Text style={styles.cardText}>
          Fecha de expiración:{" "}
          {showDetails && decryptedDetails ? decryptedDetails.cardExpiryDate : "**/**"}
        </Text>
        <Text style={styles.cardText}>
          CVV: {showDetails && decryptedDetails ? decryptedDetails.cardCVV : "***"}
        </Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={handleShowDetails}>
        <Text style={styles.buttonText}>
          {showDetails ? "Ocultar" : "Mostrar"}
        </Text>
      </TouchableOpacity>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  cardText: {
    fontSize: 18,
    marginBottom: 10,
    color: "#333",
  },
  button: {
    backgroundColor: "#007BFF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});