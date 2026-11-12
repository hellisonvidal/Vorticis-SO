# Instaladores do Vorticis SO

Três caminhos, do mais simples ao mais flexível:

## 1. Pelo Windows (sem pen-drive)

```powershell
# PowerShell como Administrador
powershell -ExecutionPolicy Bypass -File .\windows\Instalar-Vorticis.ps1 -EspacoGB 80
```

Reduz o `C:`, cria uma partição de 6 GB com o instalador, adiciona "Vorticis SO" ao menu UEFI e
agenda um boot. No Vorticis live, o instalador gráfico instala no espaço livre, **ao lado do Windows**.
Use `-Simular` para ver cada passo sem alterar nada. Requer UEFI (BIOS antigos: use o pen-drive).

## 2. Por um Linux em uso

```bash
sudo ./linux/vorticis-instalar-daqui            # ISO no disco + entrada no GRUB (não particiona nada)
sudo ./linux/vorticis-instalar-daqui --pendrive /dev/sdX   # cria pen-drive de instalação
```

## 3. Pen-drive (qualquer sistema)

Grave a ISO com `dd`, Ventoy, balenaEtcher ou Rufus (modo DD) e inicie por ele.
O instalador gráfico é o **Calamares** com a identidade do Vorticis ([`calamares/`](calamares/)):

- particionamento automático "instalar ao lado", Btrfs por padrão e criptografia opcional;
- o primeiro usuário criado é **Administrador** (grupo `vorticis-admin`);
- ao final, remove os pacotes do modo live e agenda os ajustes de primeiro boot
  (`vorticis-recursos aplicar` e `vorticis-drivers instalar --auto`).
