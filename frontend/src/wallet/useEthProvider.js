import { Platform } from 'react-native';
import { ethers } from 'ethers';

export function useEthProvider() {
  if (Platform.OS !== 'web') {
    return { ethProvider: null, getConnectedSigner: async () => { throw new Error('Solo disponible en web'); } };
  }

  let walletProvider = null;
  try {
    const { useWeb3ModalProvider } = require('@web3modal/ethers/react');
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const result = useWeb3ModalProvider();
    walletProvider = result.walletProvider;
  } catch {}

  const win = typeof window !== 'undefined' ? window : null;
  const ethProvider = win?.ethereum || walletProvider || null;

  const getConnectedSigner = async () => {
    // Detectar si window.ethereum es el proveedor nativo de MetaMask (extensión)
    // o un wrapper de Web3Modal/WalletConnect
    const isNativeExtension = win?.ethereum?.isMetaMask && !win?.ethereum?.isWalletConnect;

    console.log('[useEthProvider] getConnectedSigner', {
      hasWindowEthereum: !!win?.ethereum,
      isMetaMask: win?.ethereum?.isMetaMask,
      isWalletConnect: win?.ethereum?.isWalletConnect,
      isNativeExtension,
      hasWalletProvider: !!walletProvider,
      walletProviderIsMetaMask: walletProvider?.isMetaMask,
    });

    if (isNativeExtension) {
      console.log('[useEthProvider] Usando extensión MetaMask nativa');
      await win.ethereum.request({ method: 'eth_requestAccounts' });
      console.log('[useEthProvider] eth_requestAccounts OK');
      const provider = new ethers.BrowserProvider(win.ethereum);
      const signer = await provider.getSigner();
      console.log('[useEthProvider] signer OK, address:', await signer.getAddress());
      return signer;
    }

    // Sin extensión nativa o MetaMask no detectado: usar walletProvider de Web3Modal
    if (walletProvider) {
      console.log('[useEthProvider] Usando walletProvider de Web3Modal');
      const provider = new ethers.BrowserProvider(walletProvider);
      return provider.getSigner();
    }

    // Último recurso: intentar con window.ethereum aunque no sea MetaMask puro
    if (win?.ethereum) {
      console.log('[useEthProvider] Usando window.ethereum (no MetaMask puro)');
      await win.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.BrowserProvider(win.ethereum);
      return provider.getSigner();
    }

    throw new Error('No hay wallet disponible. Conecta MetaMask u otra wallet compatible.');
  };

  return { ethProvider, getConnectedSigner };
}
