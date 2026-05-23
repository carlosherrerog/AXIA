const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("WatchNFT", function () {
    let WatchNTF;
    let owner;  // el admin (yo)
    let client; // un cliente de prueba
    let client2;
    let watchmaker; // un relojero
    let rolex; // un fabricante
    let dealer;

    // beforeEach se ejecuta antes de cada test para proporcionar un contrato nuevo y limpio
    beforeEach (async function () {
        // 4 cuentas de prueba en el entorno Hardhat
        [owner, client, client2, watchmaker, rolex, dealer] = await ethers.getSigners();

        WatchNTF = await ethers.getContractFactory("WatchNFT");
        watchNFT = await WatchNTF.deploy();
        await watchNFT.waitForDeployment();

        await watchNFT.manageManufacturer(rolex.address, true);
        await watchNFT.connect(owner).manageWatchmaker(watchmaker.address, true);
    });


    it("Debe tener el nombre y simbolo correctos al desplegarse.", async function () {
        expect(await watchNFT.name()).to.equal("AXIA Watch");
        expect(await watchNFT.symbol()).to.equal("AXIA");
    });

    it("USER. CU 1. COMO usuario QUIERO visualizar la colección completa de mis relojes registrados.", async function () {
        // admin mintea el reloj 1 que se le asigna al cliente 1
        await watchNFT.connect(rolex).mintWatch("Rolex", "Submariner", "numeroSerie", 2024, ethers.id("NFC-001"), "ipfs://foto1", client.address);

        // admin mintea el reloj 2 que se le asigna al cliente 1
        await watchNFT.connect(rolex).mintWatch("Omega", "Speedmaster", "numeroSerie", 2024, ethers.id("NFC-002"), "ipfs://foto2", client.address);

        // se verifica que tiene 2 relojes asignados
        expect(await watchNFT.balanceOf(client.address)).to.equal(2);

        const datosReloj1 = await watchNFT.getWatchData(1);
        const datosReloj2 = await watchNFT.getWatchData(2);

        expect(datosReloj1.brand).to.equal("Rolex");
        expect(datosReloj2.brand).to.equal("Omega");   
    })

    it("USER. CU 2.COMO usuario QUIERO consultar la ficha técnica, historial de mantenimiento y la trazabilidad de propietarios.", async function () {
        // admin mintea el reloj 1 que se le asigna al él mismo
        await watchNFT.connect(rolex).mintWatch("Rolex", "Submariner",  "numeroSerie",2024, ethers.id("NFC-001"), "ipfs://foto1", owner.address);

        // admin mintea el reloj 2 que se le asigna al cliente 1
        await watchNFT.connect(rolex).mintWatch("Omega", "Speedmaster",  "numeroSerie",2024, ethers.id("NFC-002"), "ipfs://foto2", client.address);

        // 1. el admin tiene que añadir a la whitelist de relojeros certificados.
        await watchNFT.manageWatchmaker(watchmaker.address, true);

        // 2. el relojero ahora autorizado añade 2 revisiones al mismo reloj.
        await watchNFT.connect(watchmaker).addRevision(1, "Bisel cambiado");
        await watchNFT.connect(watchmaker).addRevision(1, "Revisión reloj");

        
        // 3. el cliente le compra un reloj al admin
        await watchNFT.transferFrom(owner.address, client.address, 1);

        // 4. consultas del CU (información, historial revisiones, propietario actual)
        const balance = await watchNFT.balanceOf(client.address);
    })

    it("USER. CU 3. COMO usuario QUIERO escanear el chip NFC del reloj físico con mi móvil.", async function () {
        // admin mintea el reloj 1 que se le asigna al user
        await watchNFT.connect(rolex).mintWatch("Rolex", "Submariner",  "numeroSerie", 2024, ethers.id("NFC-001"), "ipfs://foto1", client.address);

        // se simula que el móvil consulta el reloj a partir del código NFC escaneado (convertido a Hash)
        const tokenId = await watchNFT.getTokenByNFC(ethers.id("NFC-001"));

        // se verifica que el contrato nos devuelve el Token ID 1 (el supuestamente leido)
        expect(tokenId).to.equal(1);
    })

    it("USER. CU 4. COMO usuario QUIERO marcar el estado de mi NFT como 'robado' o 'perdido', siempre que el reloj no esté bloqueado por falsificación.", async function () {
        // admin mintea el reloj 1 que se le asigna al cliente 1
        await watchNFT.connect(rolex).mintWatch("Rolex", "Submariner",  "numeroSerie", 2024, ethers.id("NFC-001"), "ipfs://foto1", client.address);

        // admin mintea el reloj 2 que se le asigna al cliente 1
        await watchNFT.connect(rolex).mintWatch("Omega", "Speedmaster",  "numeroSerie", 2024, ethers.id("NFC-002"), "ipfs://foto2", client.address);

        // admin mintea el reloj 3 que se lo asigna al cliente 2
        await watchNFT.connect(rolex).mintWatch("Hamilton", "Khaki",  "numeroSerie", 2024, ethers.id("NFC-003"), "ipfs://foto3", client2.address);
        
        // 1. el cliente 1 marca el estado del reloj 1 como robado
        await watchNFT.connect(client).changeSecurityState(1, 1);
        const data1 = await watchNFT.getWatchData(1);
        expect(data1.state).to.equal(1); // 1 = Stolen

        // 2. el cliente 1 marca el estado del reloj 2 como perdido
        await watchNFT.connect(client).changeSecurityState(2, 2);
        const data2 = await watchNFT.getWatchData(2);
        expect(data2.state).to.equal(2); // 2 = Lost

        // 3. Validar estado seguridad:el cliente 1 intenta marcar el estado del reloj del cliente 2 como robado
        await expect( watchNFT.connect(client).changeSecurityState(3, 1)
        ).to.be.revertedWithCustomError(watchNFT, "NotOwner");

        // 4. Validar el estado de seguridad: el cliente 1 intenta vender su reloj perdido 
        await expect( watchNFT.connect(client).transferFrom(client.address, client2.address, 2)
        ).to.be.revertedWithCustomError(watchNFT, "TransferBlocked");

        // 5. Validar el estado de seguridad: el cliente 1 intenta vender el reloj del cliente 2
        await expect( watchNFT.connect(client).transferFrom(client2.address, client.address, 3)
        ).to.be.reverted;

        // 6. Validar el estado de seguridad: el cliente 1 intenta vender el reloj del cliente 2 al mismo cliente 2
        await expect ( watchNFT.connect(client).transferFrom(client.address, client2.address, 3)
        ).to.be.reverted;

        // 7. Validar el estado de seguridad: el cliente 2 intenta traspasarse el reloj del cliente 1
        await expect ( watchNFT.connect(client2).transferFrom(client.address, client2.address, 1)
        ).to.be.reverted;

        // 8. Validar ciclo de vida: el cliente 1 encuentra su reloj perdido (2) y lo vuelve a marcar como Activo (0)
        await watchNFT.connect(client).changeSecurityState(2, 0);
        const data2Recovered = await watchNFT.getWatchData(2);
        expect(data2Recovered.state).to.equal(0); // 0 = Active

        // 9. el Admin (o Marketplace) marca el reloj 2 como AlteredNFC (Falsificación detectada).
        await watchNFT.connect(owner).alteredWatch(2);
        const data2Altered = await watchNFT.getWatchData(2);
        expect(data2Altered.state).to.equal(4); // 4 = AlteredNFC

        // 10. Validar seguridad: el usuario ya NO puede cambiar el estado si está en AlteredNFC
        await expect(watchNFT.connect(client).changeSecurityState(2, 1)).
        to.be.revertedWithCustomError(watchNFT, "WatchAltered");

        // 12. Validar seguridad: el admin destruye el reloj 1 robado porque el cliente demuestra que es irrecuperable
        await watchNFT.burnWatch(1);
        await expect(watchNFT.ownerOf(1)).to.be.reverted; // el token ya no existe
    });

    it("USER. CU 5. COMO usuario QUIERO aprobar o revocar los permisos del contrato inteligente del Marketplace sobre mis tokens.", async function () {
        // se simula una dirección ficticia del futuro contrato WatchMarketplace
        const marketplaceAddress = "0x1111222233334444555566667777888899990000";

        // 1. el cliente otorga permisos al Marketplace sobre toda sus tokens que posee de la colección
        await watchNFT.connect(client).setApprovalForAll(marketplaceAddress, true);

        // 2. comprobación que el contrato registra la aprobación
        let isApproved = await watchNFT.isApprovedForAll(client.address, marketplaceAddress);
        expect(isApproved).to.equal(true);

        // 3. el cliente revoca los permisos al Marketplace
        await watchNFT.connect(client).setApprovalForAll(marketplaceAddress, false);

        // 4. comprobación que el contrato ha eliminado la aprobación (false)
        isApproved = await watchNFT.isApprovedForAll(client.address, marketplaceAddress);
        expect(isApproved).to.equal(false);
    })

    it("USER CU 6. COMO usuario QUIERO transferir directamente mi NFT a la cartera de otra persona.", async function () {
        await watchNFT.connect(rolex).mintWatch("Rolex", "Submariner",  "numeroSerie", 2024, ethers.id("NFC-P2P"), "ipfs://foto-p2p", client.address);
        expect(await watchNFT.ownerOf(1)).to.equal(client.address);

        // 1. el cliente 1 transfiere el reloj directamente al cliente 2
        await watchNFT.connect(client).transferFrom(client.address, client2.address, 1);

        // 2. se comprueba que el cliente 2 es el nuevo dueño
        expect(await watchNFT.ownerOf(1)).to.equal(client2.address);
        expect(await watchNFT.balanceOf(client.address)).to.equal(0);
        expect(await watchNFT.balanceOf(client2.address)).to.equal(1);
    });

    it("USER CU 7. COMO usuario QUIERO buscar y obtener la información de un reloj utilizando su número de serie.", async function () {
        const hashNFC = ethers.id("NFC-SERIAL-TEST");
        const serialNumber = "CZ-8822-ABC";

        await watchNFT.connect(rolex).mintWatch("Citizen", "Tsuyosa", serialNumber, 2024, hashNFC, "ipfs://foto", client.address);

        // 2. búsqueda por número de serie
        const watchData = await watchNFT.getWatchBySerialNumber(serialNumber);

        // VERIFICACIONES
        expect(watchData.brand).to.equal("Citizen");
        expect(watchData.model).to.equal("Tsuyosa");
        expect(watchData.serialNumber).to.equal(serialNumber);

        // 4. Validar seguridad: busca un número de serie que no existe debe dar error
        await expect(
            watchNFT.getWatchBySerialNumber("SERIE-FALSA-123")
        ).to.be.revertedWithCustomError(watchNFT, "SerialNumberNotRegistered");
    });

    it("FABRICANTE CU 1. COMO fabricante autorizado QUIERO registrar nuevos relojes y ser reconocido como creador.", async function () {
        const hashNFC = ethers.id("NFC-FAB1");
        await watchNFT.connect(rolex).mintWatch("Rolex", "Submariner",  "numeroSerie", 2024, hashNFC, "ipfs://foto-fab1", client.address);

        // 1. se comprueba que el cliente recibió el token
        expect(await watchNFT.ownerOf(1)).to.equal(client.address);

        // 2. se comprueba que los datos se guardaron correctamente, INCLUYENDO la dirección del fabricante
        const watchData = await watchNFT.getWatchData(1);
        expect(watchData.brand).to.equal("Rolex");
        expect(watchData.hashUID).to.equal(hashNFC); // Actualizado a hashUID
        expect(watchData.manufacturer).to.equal(rolex.address); 
    });

    it("FABRICANTE CU 2. (Seguridad). COMO fabricante QUIERO que el sistema bloquee la creacion de falsificaciones.", async function () {
        // 1. un usuario normal intenta hacerse pasar por un fabricante y crear un reloj falso
        await expect(
            watchNFT.connect(client).mintWatch("Rolex", "Fake-Submariner",  "numeroSerie", 2024, ethers.id("NFC-FAKE"), "ipfs://fake", client2.address)
        ).to.be.revertedWithCustomError(watchNFT, "NotAuthorizedManufacturer");
    });

    it("DEALER CU 1. COMO joyería autorizada QUIERO recibir los NFTs minteados por el fabricante.", async function () {
        const brand = "Rolex";
        const model = "Explorer";
        const serialNumber =  "numeroSerie";
        const year = 2024;
        const nfcId = ethers.id("NFC-DEALER-STOCK");
        const uri = "ipfs://rolex-explorer-metadata";

        // 1. rolex mintea el reloj y lo envía DIRECTAMENTE a la joyería (dealer)
        await expect(watchNFT.connect(rolex).mintWatch(brand, model, serialNumber, year, nfcId, uri, dealer.address))
            .to.emit(watchNFT, "WatchMinted")
            .withArgs(1, nfcId, dealer.address);

        // 2. Verificación de Propiedad: el NFT debe pertenecer a la joyería, no al fabricante
        const ownerOfToken = await watchNFT.ownerOf(1);
        expect(ownerOfToken).to.equal(dealer.address);

        // 3. Verificación de Datos: el fabricante registrado en el struct debe ser quien lo minteó
        const watchData = await watchNFT.getWatchData(1);
        expect(watchData.manufacturer).to.equal(rolex.address);
        expect(watchData.brand).to.equal(brand);

        // 4. el Dealer ahora tiene control total para, por ejemplo, transferirlo a un cliente final.
        //    Parar este ejemplo no se compra, se transfiere directamente.
        await expect(watchNFT.connect(dealer).transferFrom(dealer.address, client.address, 1)).to.not.be.reverted;
        expect(await watchNFT.ownerOf(1)).to.equal(client.address);
    });

    it("DEALER CU 2. COMO joyería autorizada QUIERO poder transferir mis NFTs a clientes finales.", async function () {
        await watchNFT.connect(rolex).mintWatch("Omega", "Seamaster",  "numeroSerie", 2024, ethers.id("NFC-DEALER-2"), "ipfs://foto", dealer.address);
        const tokenId = 1;

        // verificación que la propiedad inicial es del dealer
        expect(await watchNFT.ownerOf(tokenId)).to.equal(dealer.address);

        // 1. Ejecución: el dealer transfiere el reloj al cliente final
        await expect(
            watchNFT.connect(dealer).transferFrom(dealer.address, client.address, tokenId)
        ).to.emit(watchNFT, "Transfer")
        .withArgs(dealer.address, client.address, tokenId);

        // el cliente final es ahora el propietario en la blockchain
        expect(await watchNFT.ownerOf(tokenId)).to.equal(client.address);
    });

    it("RELOJERO CU 1. COMO relojero certificado QUIERO registrar inmutablemente las revisiones.", async function () {
        await watchNFT.connect(rolex).mintWatch("Rolex", "Submariner",  "numeroSerie", 2024, ethers.id("NFC-REV"), "ipfs://foto", client.address);

        // 1. el administrador da de alta a un relojero oficial
        await watchNFT.manageWatchmaker(watchmaker.address, true);

        // 2. el relojero autorizado añade una revisión al Token ID 1
        await watchNFT.connect(watchmaker).addRevision(1, "Mantenimiento anual y cambio de cristal.");

        // 3. Comprobamos que el historial se ha actualizado correctamente en la blockchain
        const history = await watchNFT.getRevisionHistory(1);
        expect(history.length).to.equal(1);
        expect(history[0].watchmaker).to.equal(watchmaker.address);
        expect(history[0].description).to.equal("Mantenimiento anual y cambio de cristal.");

        // 4. Validar seguridad: el cliente intenta añadir una revisión falsa a su propio reloj
        await expect(
            watchNFT.connect(client).addRevision(1, "Revision falsa para subir el precio")
        ).to.be.revertedWithCustomError(watchNFT, "NotAuthorizedWatchmaker");
    });

    it("RELOJERO CU 2. Como relojero certificado QUIERO registrar inmutablemente las verificaciones de relojes.", async function () {
        await watchNFT.connect(rolex).mintWatch("Rolex", "Submariner",  "numeroSerie", 2024, ethers.id("NFC-REV"), "ipfs://foto", client.address);
        const token1 = 1;
        const comment = "Cambio de correa por una no oficial.";

        // 1. el relojero ejecuta la verificación
        await watchNFT.connect(watchmaker).verifyAuthenticity(token1, comment);

        // 2. se lee el historial de la blockchain
        const verification = await watchNFT.getVerificationHistory(token1);
        
        // índice 0 = certificación de origen del fabricante (minteo); índice 1 = verificación del relojero
        expect(verification[1].watchmaker).to.equal(watchmaker.address);
        expect(verification[1].comment).to.equal(comment);
        expect(verification[1].date).to.be.above(0);
    });

    it("RELOJERO CU 3. COMO relojero certificado QUIERO restaurar el estado Active de un reloj marcado como alterado, tras certificar su reparación física.", async function () {
        await watchNFT.connect(rolex).mintWatch("Rolex", "Submariner",  "numeroSerie", 2024, ethers.id("NFC-REV"), "ipfs://foto", client.address);
        const token1 = 1;
       
        // 1. el admin o el Markketplace detecta un problema y marca el reloj como Altere
        await watchNFT.connect(owner).alteredWatch(token1);
        let watchData = await watchNFT.getWatchData(token1);
        expect(watchData.state).to.equal(4); // 4 = AlteredNFC

        // 3. Intento fallido: El cliente intenta restaurarlo él mismo
        await expect(
            watchNFT.connect(client).restoreAuthenticity(token1, "Intento de auto-reparación")
        ).to.be.revertedWithCustomError(watchNFT, "NotAuthorizedWatchmaker");

        // 4. Acción del Relojero:el relojero autorizado restaura la autenticidad
        const repairNote = "Se ha sustituido el módulo NFC dañado y verificado el calibre original.";
        await watchNFT.connect(watchmaker).restoreAuthenticity(token1, repairNote);

        // 5. Verificación de Estado: el reloj debe volver a estar Active (0)
        watchData = await watchNFT.getWatchData(token1);
        expect(watchData.state).to.equal(0); // 0 = Active

        // 6. Verificación de Historial: la reparación debe aparecer en el historial de revisiones
        const history = await watchNFT.getRevisionHistory(token1);
        const lastRevision = history[history.length - 1];
    
        expect(lastRevision.description).to.equal(repairNote);
        expect(lastRevision.watchmaker).to.equal(watchmaker.address);
        expect(lastRevision.date).to.be.above(0);

        // 7. el cliente ya lo puede transferir
        await expect(
            watchNFT.connect(client).transferFrom(client.address, client2.address, token1)
        ).to.not.be.reverted;
    });

    it("SISTEMA. CU 1. COMO fabricante QUIERO que el sistema detecte si el chip NFC ha sido manipulado físicamente o despegado.", async function () {
        await watchNFT.connect(rolex).mintWatch("Rolex", "Submariner",  "numeroSerie", 2024, ethers.id("NFC-001"), "ipfs://foto1", client.address);
        await watchNFT.connect(rolex).mintWatch("Omega", "Speedmaster",  "numeroSerie", 2024, ethers.id("NFC-002"), "ipfs://foto2", client.address);

        // 1. el sistema detecta la rotura física. El fabricante invalida el token.
        await watchNFT.connect(owner).alteredWatch(1);

        // 2. se comprueba que el estado interno en la blockchain es efectivamente AlternedNFC (4)
        const watchData = await watchNFT.getWatchData(1);
        expect(watchData.state).to.equal(4);

        // 4. se verifica que la seguridad actúa: el cliente ya no puede vender un reloj invalidado
        await expect(
            watchNFT.connect(client).transferFrom(client.address, client2.address, 1)
        ).to.be.revertedWithCustomError(watchNFT, "TransferBlocked")
    })


    it("ADMIN CU 1. COMO administrador QUIERO gestionar la whitelist de relojeros autorizados.", async function () {

        // 1. el admin añade al relojero a la whitelist
        await watchNFT.manageWatchmaker(watchmaker.address, true);
        expect(await watchNFT.authorizedWatchmakers(watchmaker.address)).to.equal(true);

        // 2. el admin añade un dealer a la whitelist
        await watchNFT.connect(owner).manageDealer(dealer.address, true);
        expect(await watchNFT.authorizedDealers(dealer.address)).to.equal(true);

        // 3. Validar seguridad: un usuario normal intenta autorizar a relojeros y dealers
        await expect(
            watchNFT.connect(client).manageWatchmaker(client.address, true),
            watchNFT.connect(client).manageDealer(client2.address, true)
        ).to.be.revertedWithCustomError(watchNFT, "OwnableUnauthorizedAccount");

        // 4. el admin quita la autorización
        await watchNFT.connect(owner).manageDealer(dealer.address, false);
        expect(await watchNFT.authorizedDealers(dealer.address)).to.equal(false);
        await watchNFT.manageWatchmaker(watchmaker.address, false);
        expect(await watchNFT.authorizedWatchmakers(watchmaker.address)).to.equal(false);
    });

    it("ADMIN CU 2. COMO administrador QUIERO poder pausar temporalmente las funciones criticas del contrato inteligente.", async function () {
        await watchNFT.connect(rolex).mintWatch("Rolex", "Submariner",  "numeroSerie", 2024, ethers.id("NFC-P1"), "ipfs://foto1", client.address);

        // 1. El administrador activa la pausa de emergencia
        await expect(watchNFT.pauseContract()).to.emit(watchNFT, "Paused").withArgs(owner.address);

        // 2. Validar seguridad: la red bloquea el intento de crear nuevos relojes
        await expect(
            watchNFT.connect(rolex).mintWatch("Omega", "Speedmaster",  "numeroSerie", 2024, ethers.id("NFC-P2"), "ipfs://foto2", client.address)
        ).to.be.reverted;

        // 3. Validar seguridad: la red bloquea la modificacion de estados o revisiones
        await expect(
            watchNFT.connect(client).changeSecurityState(1, 1)
        ).to.be.reverted;

        // 5. Validar seguridad: un usuario normal no puede quitar la pausa
        await expect(
            watchNFT.connect(client).resumeContract()
        ).to.be.reverted;

        // 6. un relojero no puede añadir revisiones mientras hay una emergencia
        await expect(
            watchNFT.connect(watchmaker).addRevision(1, "Reparación urgente")
        ).to.be.revertedWithCustomError(watchNFT, "EnforcedPause");
        
        // 6. el cliente intenta enviar su reloj a otro cliente durante la pausa
        await expect(
            watchNFT.connect(client).transferFrom(client.address, client2.address, 1)
        ).to.be.revertedWithCustomError(watchNFT, "EnforcedPause");

        // 7. el admin desactiva la pausa y todo vuelve a la normalidad
        await expect(watchNFT.resumeContract()).to.emit(watchNFT, "Unpaused").withArgs(owner.address);
        
        // 8. se compruebas que el sistema vuelve a permitir mintear
        await watchNFT.connect(rolex).mintWatch("Omega", "Speedmaster",  "numeroSerie", 2024, ethers.id("NFC-P2"), "ipfs://foto2", client.address);
        expect(await watchNFT.ownerOf(2)).to.equal(client.address);
    });

    it("ADMIN CU 3. COMO administrador QUIERO poder destruir el NFT de un reloj de forma irreversible.", async function () {
        await watchNFT.connect(rolex).mintWatch("Rolex", "Submariner",  "numeroSerie", 2024, ethers.id("NFC-BURN"), "ipfs://foto-burn", client.address);

        // 1. se comprueba que el token existe y pertenece al cliente
        expect(await watchNFT.ownerOf(1)).to.equal(client.address);

        // 2. Validar seguridad: el cliente intenta destruir su propio reloj
        await expect(
            watchNFT.connect(client).burnWatch(1)
        ).to.be.reverted; // falla porque no es el Owner del contrato

        // 3. el admin ejecuta la destrucción oficial del activo
        await watchNFT.burnWatch(1);

        // 4. se comprueba que el token ha sido eliminado de la blockchain
        await expect(watchNFT.ownerOf(1)).to.be.reverted;
    });

    it("ADMIN CU 4. COMO administrador QUIERO poder activar y desactivar un bloqueo administrativo.", async function () {
        await watchNFT.connect(rolex).mintWatch("Rolex", "Submariner",  "numeroSerie", 2024, ethers.id("NFC-BURN"), "ipfs://foto-burn", client.address);

        const tokenId = 1; // ID del reloj de prueba
        
        // 1. Validar seguridad: intentar bloquear como un usuario normal
        await expect(
            watchNFT.connect(client).setLock(tokenId, true)
        ).to.be.revertedWithCustomError(watchNFT, "OwnableUnauthorizedAccount");

        // 2. bloqueo como administrador
        await watchNFT.connect(owner).setLock(tokenId, true);
        expect(await watchNFT.isLocked(tokenId)).to.equal(true);

        // 3. Validar seguridad: intentar transferir el reloj estando bloqueado.
        //    Aunque client1 sea el dueño, el require(!isLocked) de _update lo impedirá
        await expect(
            watchNFT.connect(client).transferFrom(client.address, client2.address, tokenId)
        ).to.be.revertedWithCustomError(watchNFT, "TokenLockedAdmin");

        // 4. se desloquea y se verifica que ya se puede transferir
        await watchNFT.connect(owner).setLock(tokenId, false);
        await watchNFT.connect(client).transferFrom(client.address, client2.address, tokenId);
        expect(await watchNFT.ownerOf(tokenId)).to.equal(client2.address);
    });  

    it("ADMIN CU 5. COMO administrador QUIERO vincular la dirección del Marketplace.", async function () {
        await watchNFT.connect(rolex).mintWatch("Rolex", "Submariner",  "numeroSerie", 2024, ethers.id("NFC-MKT"), "ipfs://foto", client.address);
        const tokenId = 1;

        // client2 para simular ser el contrato del Marketplace en este test unitario
        const mockMarketplace = client2;

        // 1. Validar seguridad: un usuario normal NO puede vincular el marketplace
        await expect(
            watchNFT.connect(client).setMarketplaceAddress(mockMarketplace.address)
        ).to.be.revertedWithCustomError(watchNFT, "OwnableUnauthorizedAccount");

        // 2. el administrador vincula la dirección del Marketplace
        await watchNFT.connect(owner).setMarketplaceAddress(mockMarketplace.address);
        expect(await watchNFT.marketplaceAddress()).to.equal(mockMarketplace.address);

        // 3. Validar seguridad: el dueño del reloj intenta autoboicotearse o usar la función reservada
        await expect(
            watchNFT.connect(client).alteredWatch(tokenId)
        ).to.be.revertedWithCustomError(watchNFT, "NotAuthorized");

        // 4. el Marketplace simulado ejecuta la sanción automática
        await expect(watchNFT.connect(mockMarketplace).alteredWatch(tokenId)).to.emit(watchNFT, "SecurityStateChanged")
            .withArgs(tokenId, 4); // 4 = AlteredNFC

        // 5. verificación que el estado final del reloj en la blockchain es AlteredNFC
        const watchData = await watchNFT.getWatchData(tokenId);
        expect(watchData.state).to.equal(4);
    });

    it("ADMIN CU 6. COMO administrador QUIERO poder marcar manualmente un reloj como AlteredNFC por orden legal o detección de fraude fuera del flujo comercial estándar.", async function () {
        await watchNFT.connect(rolex).mintWatch("Rolex", "Datejust",  "numeroSerie", 2024, ethers.id("NFC-LEGAL"), "ipfs://foto-legal", client.address);
        const tokenId = 1;

        // 1. Validar seguridad: un usuario normal intenta invalidar el reloj (Debe fallar)
        await expect(
            watchNFT.connect(client).alteredWatch(tokenId)
        ).to.be.revertedWithCustomError(watchNFT, "NotAuthorized");

        // 2. el administrador ejecuta la invalidación por orden legal
        await watchNFT.connect(owner).alteredWatch(tokenId);
        const watchData = await watchNFT.getWatchData(tokenId);
        expect(watchData.state).to.equal(4); // 4 = AlteredNFC

        // el reloj ha quedado bloqueado comercialmente, el cliente ya no puede moverlo, venderlo ni transferirlo
        await expect(
            watchNFT.connect(client).transferFrom(client.address, client2.address, tokenId)
        ).to.be.revertedWithCustomError(watchNFT, "TransferBlocked");
    });

    it("ADMIN CU 7. COMO administrador QUIERO vincular la identidad física del reloj a la blockchain de forma privada mediante el Hash del UID.", async function () {
        const uidNFC = "63C23204"; // el UID 
        const hashUID = ethers.id(uidNFC); // se hashea el UID
        
        // 1. el Fabricante registra el reloj usando la huella digital (Hash), nunca el UID en texto claro
        await watchNFT.connect(rolex).mintWatch("Citizen", "Quartz Diver 1982", "CZ-7721-XP", 1982, hashUID, "ipfs://foto-citizen", client.address);
        const tokenId = 1;

        // 2. Comprobación de Privacidad: se asegura que el contrato puede encontrar el TokenID usando el Hash
        expect(await watchNFT.getTokenByNFC(hashUID)).to.equal(tokenId);

        // 3. Autenticación Positiva: el servidor Python manda el hash correcto al leer el Citizen
        const isAuthentic = await watchNFT.verifyHash(tokenId, hashUID);
        expect(isAuthentic).to.equal(true);

        // 4. Autenticación Negativa (Seguridad): un falsificador usa un chip diferente ("FFFFFFFF")
        const fakeHash = ethers.id("FFFFFFFF");
        const isFakeAuthentic = await watchNFT.verifyHash(tokenId, fakeHash);
        
        // el contrato inteligente rechaza la firma
        expect(isFakeAuthentic).to.equal(false);
    });

    it("ADMIN CU 8. COMO administrador QUIERO modificar el Hash del chip NFC de un reloj en caso de reparación o sustitución física.", async function () {
        const oldHash = ethers.id("OLD-CHIP-001");
        const newHash = ethers.id("NEW-CHIP-002");
        const serialNumber = "CZ-REPAIR-99";

        await watchNFT.connect(rolex).mintWatch("Rolex", "Submariner", serialNumber, 2024, oldHash, "ipfs://foto-repair", client.address);
        const tokenId = 1;

        // 1. Verificación inicial: el contrato reconoce el chip antiguo
        expect(await watchNFT.verifyHash(tokenId, oldHash)).to.be.true;

        // 2. Validar seguridad: un usuario normal intenta cambiar el Hash (debe fallar)
        await expect(
            watchNFT.connect(client).setWatchHash(tokenId, newHash)
        ).to.be.revertedWithCustomError(watchNFT, "OwnableUnauthorizedAccount");

        // 3. el admin actualiza el Hash al sustituir la pieza NFC
        await watchNFT.connect(owner).setWatchHash(tokenId, newHash);

        // 4. Verificaciones Finales: el chip antiguo ya no es válido, el nuevo sí
        expect(await watchNFT.verifyHash(tokenId, oldHash)).to.be.false;
        expect(await watchNFT.verifyHash(tokenId, newHash)).to.be.true;

        // se verifica que el struct principal de datos también se ha sincronizado con el nuevo Hash
        const watchData = await watchNFT.getWatchData(tokenId);
        expect(watchData.hashUID).to.equal(newHash);
    });

})