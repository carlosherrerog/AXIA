import { Platform } from 'react-native';
import { ethers } from 'ethers';

// Polygon Amoy exige mínimo 25 gwei de tip. Usamos 30 gwei como margen seguro.
const MIN_PRIORITY_FEE = ethers.parseUnits('30', 'gwei');

function applyMinGasFee(provider) {
  const _getFeeData = provider.getFeeData.bind(provider);
  provider.getFeeData = async () => {
    const feeData = await _getFeeData();
    const tip = feeData.maxPriorityFeePerGas ?? 0n;
    const adjustedTip = tip < MIN_PRIORITY_FEE ? MIN_PRIORITY_FEE : tip;
    return new ethers.FeeData(
      feeData.gasPrice,
      feeData.maxFeePerGas,
      adjustedTip,
    );
  };
  return provider;
}

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
    const isNativeExtension = win?.ethereum?.isMetaMask && !win?.ethereum?.isWalletConnect;

    if (isNativeExtension) {
      await win.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = applyMinGasFee(new ethers.BrowserProvider(win.ethereum));
      return provider.getSigner();
    }

    if (walletProvider) {
      const provider = applyMinGasFee(new ethers.BrowserProvider(walletProvider));
      return provider.getSigner();
    }

    if (win?.ethereum) {
      await win.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = applyMinGasFee(new ethers.BrowserProvider(win.ethereum));
      return provider.getSigner();
    }

    throw new Error('No hay wallet disponible. Conecta MetaMask u otra wallet compatible.');
  };

  return { ethProvider, getConnectedSigner };
}
