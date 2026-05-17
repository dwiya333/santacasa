let clients = [];
let editingIndex = null;

function addClient() {
    const codeName = document.getElementById('clientCodeName').value.trim();
    const link = document.getElementById('clientLink').value.trim();
    if (!codeName || !link) {
        alert('Preencha os campos.');
        return;
    }
    const parts = codeName.split(' - ');
    if (parts.length < 2) {
        alert('Formato inválido. Use: Código - Nome');
        return;
    }
    const code = parts[0].trim();
    const name = parts.slice(1).join(' - ').trim();
    if (editingIndex === null) {
        clients.push({code, name, link});
    } else {
        clients[editingIndex] = {code, name, link};
        editingIndex = null;
        document.getElementById('addClientButton').textContent = 'Adicionar Cliente';
    }
    updateClientsList();
    clearClientForm();
}

function editClient(index) {
    const client = clients[index];
    document.getElementById('clientCodeName').value = `${client.code} - ${client.name}`;
    document.getElementById('clientLink').value = client.link;
    editingIndex = index;
    document.getElementById('addClientButton').textContent = 'Salvar Cliente';
}

function removeClient(index) {
    if (!confirm('Remover este cliente?')) return;
    clients.splice(index, 1);
    if (editingIndex === index) {
        editingIndex = null;
        document.getElementById('addClientButton').textContent = 'Adicionar Cliente';
        clearClientForm();
    }
    updateClientsList();
}

function clearClientForm() {
    document.getElementById('clientCodeName').value = '';
    document.getElementById('clientLink').value = '';
}

function clearEdit() {
    editingIndex = null;
    document.getElementById('addClientButton').textContent = 'Adicionar Cliente';
    clearClientForm();
}

function printPage() {
    window.print();
}

function copyCodes() {
    const codes = document.getElementById('codesList').value;
    navigator.clipboard.writeText(codes).then(() => {
        alert('Códigos copiados para a área de transferência!');
    }).catch(err => {
        alert('Erro ao copiar: ' + err);
    });
}

function updateClientsList() {
    const list = document.getElementById('clientsList');
    list.innerHTML = clients.map((c, index) => `
        <p>
            <strong>${c.code}</strong> - ${c.name} - <a href="${c.link}" target="_blank">Link</a>
            <button onclick="editClient(${index})">Editar</button>
            <button onclick="removeClient(${index})">Remover</button>
        </p>
    `).join('');

    const codes = clients.map(c => c.code).join(', ');
    document.getElementById('codesList').value = codes;
}

function generateQRs() {
    const qrsDiv = document.getElementById('qrs');
    qrsDiv.innerHTML = '';
    if (clients.length === 0) {
        alert('Adicione clientes primeiro.');
        return;
    }
    const pageSize = 15;
    let page = null;
    clients.forEach((client, index) => {
        if (index % pageSize === 0) {
            page = document.createElement('div');
            page.className = 'qr-page';
            qrsDiv.appendChild(page);
        }
        const container = document.createElement('div');
        container.className = 'qr-item';
        container.setAttribute('data-name', client.name);
        container.innerHTML = `<p><strong>${client.name}</strong><br>${client.code}</p>`;
        const img = document.createElement('img');
        img.crossOrigin = 'anonymous';
        img.src = `https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${encodeURIComponent(client.link)}`;
        img.alt = `QR Code para ${client.name}`;
        container.appendChild(img);
        page.appendChild(container);
    });
}

function filterQRs() {
    const filterValue = document.getElementById('filter').value.toLowerCase();
    const items = document.querySelectorAll('.qr-item');
    items.forEach(item => {
        const name = item.getAttribute('data-name').toLowerCase();
        item.style.display = name.includes(filterValue) ? 'block' : 'none';
    });
    
}
function downloadAllQRs() {
    const items = document.querySelectorAll('.qr-item');

    if (items.length === 0) {
        alert('Clique em "Gerar QR Codes" primeiro antes de baixar.');
        return;
    }

    let started = false;
    items.forEach(item => {
        const img = item.querySelector('img');
        const name = item.getAttribute('data-name') || '';
        const firstName = name.trim().split(' ')[0] || 'Cliente';
        const pText = item.querySelector('p') ? item.querySelector('p').innerText : '';
        const code = pText.split('\n').pop().trim();
        const fileName = `qrcode, loc - ${firstName} ${code}.jpeg`;

        if (!img || !img.complete || img.naturalWidth === 0 || img.naturalHeight === 0) {
            console.warn('Imagem não carregada:', fileName);
            return;
        }

        try {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
            const link = document.createElement('a');
            link.style.display = 'none';
            link.href = dataUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            started = true;
        } catch (err) {
            console.error('Erro ao gerar download do QR code:', fileName, err);
        }
    });

    if (!started) {
        alert('Não foi possível iniciar nenhum download. Antes de baixar, gere os QR codes e aguarde o carregamento das imagens.');
    }
}