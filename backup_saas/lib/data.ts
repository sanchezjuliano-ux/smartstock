export const PROFILES = [
  {
    name: 'Administrador',
    role: 'admin',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCpJbgc9A8Vlpe4_RJOnDcNsidoag7Sd7OzZB1HQBRjqhFEQqH2Y-xi4n3KXW3sirG7IbgAKnTVkGmOfFeYQdJWroYJGMt6OuSTkijYUTJxoogcvZoFb35Eo339fS2LCUZb6XMp8I0Vfz7tU5fFSVWXFwffImUXWGsnqhvulqGCRVhkaJOP2tEdTDaG4VEZuWYF6RiP2YPhdjVkTVGo3mNVL3ROK7ZgdlFnBOmSt5DeAL4jABX-IJ6FE_qvvY_PNbztJHMo4IWydol7',
    password: '123'
  },
  {
    name: 'Maria',
    role: 'user',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA34NCrDVMRf_3I45bioyPdSIba4XyCihlAEiPqTSTgEdK0O13x4w2WI9z2tccxLzAEXKL89Lpzp4do1i05Qm-JEJaAEEfjw1LgF8sFK90ZufVrrPnMFueeE9U1KbUkOE2W9sFhWl6WtvIXMP3sLA_89e6hsI592vi2dFJCWVPm5CCQOM3pxIpWYWsp3uBCe_ydXyu50Jv5PGsIVpVOrk8wUEi0KCjoQ2Jos-MJp64zgsBHPqehKemLqrEmRVrjlPaZJP558ZjDeIun',
    password: '123'
  },
  {
    name: 'João',
    role: 'user',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB0MN38FSCVlaXj1vxf96cLVbPFqd2ppoZlk0ygu67R35dbhuvzxPOrwA9IvbHhdYUmlWVFrisxnGjzUGz6mSFsi1fKBI24nQP_qoTajStDIaJrNggcvdsCjVFEtRu8Bh7vehl98znP50E1thrbyQXYuZb3mpV7_Fodldh2i8nki0BhNqQjhFCh7VK9-sBHgfS0MHbWpiW6PQB8UEi-u8OPy5tL333lM3XAbKLFKa60US6A4VvQdt_Ah8o_YfNHgCZdMJptS_1Q8fQF',
    password: '123'
  }
];

export const INVENTORY = [
  { id: 1, name: 'Macarrão Penne 500g', brand: 'Barilla', category: 'Despensa', price: 8.90, validity: '12/24', stock: 4, minStock: 2, status: 'EM ESTOQUE', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAWNxStqNVVLpR0RcZyEJdqxdZHFEkXkLS4Y9ZOVY1YaskwlL4PFsuxGixrQN-pkWWRWnsABgFjWb_ufRCx7B8grp3BLIEmtq_vN-9SkP_54cy-6yd5oQErvC4rO7Md6a9_be2ENzMlRgZKQ4M4tXG8EY35LqZTt1LCsd6QMfw60r1VI2Q_6bF2PSi485NNK0H_jc3p7oP-U5QxEMDrMThEc1GI2ub7AtLC38b4Z7VmC1fyEtDTt3qHK2_mL4dwo-1j7rUnTQyVOzmv' },
  { id: 2, name: 'Café Torrado 250g', brand: 'Orfeu', category: 'Despensa', price: 24.50, validity: '10/24', stock: 1, minStock: 2, status: 'ESTOQUE BAIXO', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDaL8XKIzAkfyFudV838r_05I6zBNN-81_LsVdsre0oTdJgAx5LytrugnNyRsp0L3QBN_NjpRQpm2drzsWcj8DHCa4hrubqy27vX-lJJXva7jgUQ8_sLiN_gbn3aq_844oIY8ef5PkDZChd86fCDSvnIKL1WgWZ54csMLBNyVvAQDWMT1mIC2yzXY_1qUdkzn0MorATRnCAzh54jqzyQ2W95vLI2KEn-355hx3c7utumoNQCl4ZEwE-tZCcDycTaddjxDva3d5rBFx1' },
  { id: 3, name: 'Arroz Branco 1kg', brand: 'Tio João', category: 'Despensa', price: 6.20, validity: '01/25', stock: 3, minStock: 1, status: 'EM ESTOQUE', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBWYz9TP8gyc7N69ivtiMINcQdlTS8vImnFgo6HFJv8JUCfh1tHyJ86klQlmvE8H7BZlLhkQP3Zm3VpBoU3-QKEC7jY7N_exNAzawM8GdTcGVkmHOy3jZJcSYX2DU7H41iNER9bDhvWdewgER_xs0pZcJu0StG-ycIyKVnWyp5w9unLYfIEWm7hkyIQ36a23NG6Bc3ZZZRJuopr4x61zGkcqMVt-GmMcSuX64oUCsQmFIE9Q4VI6pBmfhMV-bZE4BeW26y0K14qFJjp' },
  { id: 4, name: 'Chocolate Amargo 70%', brand: 'Lindt', category: 'Despensa', price: 18.90, validity: '05/24', stock: 2, minStock: 1, status: 'EM ESTOQUE', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBWej2pMZ9wb4nSi3qIhPkTV9Wi2C12xYw-ovMgiU16q3ZT0zCb5LgDl8oM-bnDPmqEZHM6r4L6uKijNYb_WKbJLC9_UpTWXxEZkpwtoLIyZBMWAUeF6WsGVirBQAxtJffFU6rZHbIa5ZdDM6GHib2uncj0O_PK9AavOVOD_3sM-Nb0nNyieEJKpzv6xqxN3qRBWCld-27BrLOBWJorfVqoJYOxh_jS7Bm3-8lDfQQFp9yGBxVSBM-VT_P3O_hIA7fTf89FQuoMmc92' },
  { id: 5, name: 'Sabonete Líquido', brand: 'Dove 250ml', category: 'Higiene', price: 15.90, validity: '-', stock: 6, minStock: 2, status: 'EM ESTOQUE', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBq-FG6NT9UOv-nXbHY4bFplUvMQFBO509LFVfL2GWhHWer_tBLuvcV2z_o8Di6PDiigIjRldLLj8gPD7hPVA5m4HnbJ7R7fteDyvpav0X2n85xV0YQB0z5uWE7NaxegOXv4phB6DGqqMz6LU3J9eCZgpnY4b61QRkMSTdW478xd7QO6v3ApQOpn8Oj56CRO-wbnz9HF3ERXUW44-YSzXpeSoUXJ9bJImIm3GB9lYnS8RZrGHWe9MhwxQcZ1s4SSAeosDiDSxftNK7l' },
  { id: 6, name: 'Creme Dental', brand: 'Colgate 90g', category: 'Higiene', price: 4.50, validity: '-', stock: 2, minStock: 1, status: 'EM ESTOQUE', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDOCQgoRJ5b6qqTUyLdkwF5_ttY-hX1EBdEhNfyYXwoydeWeAl4qSOqnlTW3K3_4eYG71DLOLWVuop9u9ftaTO-x-qQXIWnVFKEWbRbvskgIz1svGSbWS3z2gHnKqK2cTKhWf9LvP8c05krPFtMW_EOgy3EuhFes38Az58QxXLLUBV_1RteMy_AVDqirw775PuvwhXZNRmlQV510edVKGISech8Vf6jt85VgJdfeR0cNJB260vXA3eqhnTpeZpeoMGUST4y4zik4YqW' },
  { id: 7, name: 'Lava Roupas', brand: 'Omo 3L', category: 'Limpeza', price: 42.00, validity: '-', stock: 1, minStock: 2, status: 'ESTOQUE BAIXO', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC1MXn3ikqhfhzK1h_UCyqKb2yCKO2ml3_m23j5A3iqjgSTNzv1sIBGU-JIbw17EbuP7oFA8HnThId0Q6_CkkIBrSK0ox61OBaPOiVLjTQg_KgepznaYKYCDpIAXgVpf6b2bgq-uIVPZ2v0bDGdg9GVaDTUthrIql03M1XSXJy-z5SalSw7zgDiF1lNr_06RDvZsG3Hynyb7QFBzLK1IWda43Obdm3hf6A5TRDEsa4SQChYh7zox7t2LCdUCUI-dw5uqtYu2XjTz1Fp' },
  { id: 8, name: 'Multiuso', brand: 'Veja 500ml', category: 'Limpeza', price: 9.90, validity: '-', stock: 4, minStock: 2, status: 'EM ESTOQUE', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBgC_9kog3wxXQqHByhjCPTa75OczYtD27qEPPJDwgC0GC0BaUF_Tn4Y4YvZT5qOosXWW3PDxqV2VX1jNjw8pxEaj9hp1mevdmmwsvY99B0dik9iDmcXvwC036RHNtE2USMFhX_vb5d610JHjkN8-dJT8_Ttnr6VXCS0CkTnto1PPY2rlAGjGTt-LIMLMf9djhBwOKekzogspSY7S-mcWXlmDXtXFNPWM347gVb3in-4_jKAmkQSNk49H93sMwpCG8cZuLaaBmoJvFZ' }
];

export const URGENT_REPLENISHMENT = [
  { id: 10, name: 'Leite Desnatado 1L', brand: 'Bebidas • Nestlé', price: 5.80, recommendedBy: 'JD', recommenderName: 'João Duarte', qty: 12, icon: 'local_drink' },
  { id: 11, name: 'Detergente Líquido 5L', brand: 'Limpeza • OMO', price: 42.90, recommendedBy: 'MA', recommenderName: 'Maria Alves', qty: 1, icon: 'soap' },
  { id: 12, name: 'Pão de Forma Integral', brand: 'Alimentos • Pullman', price: 9.50, recommendedBy: 'RC', recommenderName: 'Ricardo Costa', qty: 2, icon: 'breakfast_dining' },
];

export const HISTORY_ITEMS = [
  { id: 1, store: 'Supermercado Central', date: '15 Mai, 2024 • 14:30', amount: 452.90, items: 'Azeite Extra Virgem, Leite Integral (12x), Café em Grãos...', count: 24, icon: 'store' },
  { id: 2, store: 'Hortifruti da Villa', date: '12 Mai, 2024 • 09:15', amount: 89.40, items: 'Bananas Prata, Morangos, Espinafre Fresco...', count: 8, icon: 'local_mall' },
  { id: 3, store: 'Padaria Panificadora', date: '10 Mai, 2024 • 18:00', amount: 32.50, items: 'Pão Integral, Queijo Minas Frescal...', count: 3, icon: 'shopping_basket' },
];
