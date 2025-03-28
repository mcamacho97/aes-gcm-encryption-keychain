import forge from "node-forge";

export const generateAESKeyAndIV = () => {
  const aesKey = forge.random.getBytesSync(32);
  const iv = forge.random.getBytesSync(16);
  return {
    aesKey: forge.util.createBuffer(aesKey),
    iv: forge.util.createBuffer(iv)
  };
};

export const encryptData = <T>(data: T, key: forge.util.ByteStringBuffer, iv: forge.util.ByteStringBuffer) => {
  let plaintext = JSON.stringify(data);

  let cipher = forge.cipher.createCipher('AES-GCM', key.bytes());
  cipher.start({
    iv: iv.bytes(),
    tagLength: 128
  });
  
  cipher.update(forge.util.createBuffer(plaintext));
  cipher.finish();
  
  const combined = forge.util.createBuffer();
  combined.putBytes(cipher.output.getBytes());
  combined.putBytes(cipher.mode.tag.getBytes());

  return combined;
};

export const decryptData = <T>(cipher: forge.util.ByteStringBuffer, key: forge.util.ByteStringBuffer, iv: forge.util.ByteStringBuffer): T => {
  const data = cipher.copy();
  const tagLength = 16;
  const messageLength = data.length() - tagLength;
  
  const ciphertext = forge.util.createBuffer(data.getBytes(messageLength));
  const tag = forge.util.createBuffer(data.getBytes(tagLength));

  let decipher = forge.cipher.createDecipher('AES-GCM', key.bytes());
  decipher.start({
    iv: iv.bytes(),
    tagLength: 128,
    tag: tag
  });
  
  decipher.update(ciphertext);
  const pass = decipher.finish();
  
  if (!pass) {
    throw new Error('Failed to authenticate decrypted data');
  }

  return JSON.parse(decipher.output.toString());
};