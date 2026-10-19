const fs = require('fs');
const path = require('path');

// Dados brutos enviados pelo usuário
const rawText = `COLABORADOR,SETOR,HOSTNAME,OBSERVAÇÕES,SERVICE TAG,MODELO,DESCRIÇÃO DO ITEM,REDE WI-FI,Endereço MAC,,
Karine Lima de Souza,Contas a receber,DESKTOP-A+C2:C38T4C2UV,,7JXXXT3,Dell Vostro 15 3510,Notebook,,,Recebido Weber,
Juliana Vieira,Cobrança,RSADMD001,,9D557X3,Dell OptiPlex 3000,Desktop,REDE CABEADA,74-86-E2-F6-28-7C,,
Eliane Rosa de Morais,Financeiro,RSADMD002,Computador em Goiânia,6D557X3,Dell OptiPlex 3000,Desktop,,,Ver com o Deiry,
Karine Dornelles,Cobrança,RSADMD003,,CF557X3,Dell OptiPlex 3000,Desktop,REDE CABEADA,74-86-E2-F6-27-83,Recebido Weber,
Ingryd Pacheco Dilsson,Cobrança,RSADMD004,ver planilha Empréstimos,GF557X3,Dell OptiPlex 3000,Desktop,REDE CABEADA,74-86-E2-F6-82-55,Recebido Weber,
Renata da Silva,Contas a receber,RSADMD005,,4C557X3,Dell OptiPlex 3000,Desktop,REDE CABEADA,74-86-E2-F6-87-8A,Recebido Weber,
Marcus Vinicius Freitas,Financeiro,RSADMD006,Home Office,7G557X3,Dell OptiPlex 3000,Desktop,,,Recebido Weber,
Rafael Alexandre Michalski,Retenção,RSADMD007,,3G557X3,Dell OptiPlex 3000,Desktop,REDE CABEADA,74-86-E2-F6-82-A6,Recebido Weber,
Daniel Barbosa De Moura,Backoffice,RSADMD008,,GB557X3,Dell OptiPlex 3000,Desktop,REDE CABEADA,74-86-E2-F6-25-94,Recebido Weber,
Gabriela de Freitas Rodrigues,Retenção,RSADMD009,,1C557X3,Dell OptiPlex 3000,Desktop,REDE CABEADA,74-86-E2-F6-87-D8,Recebido Weber,
Alessandra da Silva,Atendimento,RSADMD010,ver planilha Empréstimos,5C557X3,Dell OptiPlex 3000,Desktop,REDE CABEADA,74-86-E2-F6-7D-4F,Recebido Weber,
Claudia Recova,Atendimento,RSADMD011,,JD557X3,Dell OptiPlex 3000,Desktop,REDE CABEADA,74-86-F6-E2-7B-48,Recebido Weber,
Daniele Trindade De Souza,Retenção,RSADMD012,,HF557X3,Dell OptiPlex 3000,Desktop,REDE CABEADA,74-86-E2-F6-7E-7A,Recebido Weber,
Emerson Santos,Atendimento,RSADMD013,,5G557X3,Dell OptiPlex 3000,Desktop,REDE CABEADA,74-86-E2-F6-7D-EA,Recebido Weber,
Igor Kauam Dornelles França,Atendimento,RSADMD014,,8F557X3,Dell OptiPlex 3000,Desktop,REDE CABEADA,74-86-E2-F6-24-F6,Recebido Weber,
Elisa Linhar,Atendimento,RSADMD015,ver planilha Empréstimos,DF557X3,Dell OptiPlex 3000,Desktop,REDE CABEADA,74-86-E2-F6-7E-1C,Recebido Weber,
Cristiane Santos,Atendimento,RSADMD016,,BF557X3,Dell OptiPlex 3000,Desktop,REDE CABEADA,74-86-E2-F6-85-59,Recebido Weber,
Luciano Sitnievski Júnior,Cobrança,RSADMD017,ver planilha Empréstimos,4G557X3,Dell OptiPlex 3000,Desktop,REDE CABEADA,74-86-E2-F6-80-B4,Recebido Weber,
Fernanda dos Santos,Recursos Humanos,RSADMD018,,HC557X3,Dell OptiPlex 3000,Desktop,REDE CABEADA,74-86-E2-F6-27-87,Recebido Weber,
Viviane da Silva,Atendimento,RSADMD019,,JF557X3,Dell OptiPlex 3000,Desktop,REDE CABEADA,74-86-E2-F6-81-F6,Recebido Weber,
Laura Rosa Lattuada,Contas a receber,RSADMD020,,H4P6H24,Dell OptiPlex 7010,Desktop,REDE CABEADA,D0-94-66-E5-8D-91,Recebido Weber,
Sara Ingred Silva Germano,Financeiro,RSADMD021,,GD557X3,Dell OptiPlex 3000,Desktop,REDE CABEADA,74-86-E2-F6-79-77,Ver com Deiry,
Juan Davi Vidal Borges,Atendimento,RSADMD022,,CB557X3,Dell OptiPlex 3000,Desktop,REDE CABEADA,74-86-E2-F6-88-20,Recebido Weber,
Alice dos Santos Dapper,Juridico,RSADMD023,,3F557X3,Dell OptiPlex 3000,Desktop,REDE CABEADA,74-86-E2-F6-29-D4,Recebido Weber,
Thais Santos do Nascimento,Atendimento,RSADMD024,ver planilha Empréstimos,6G557X3,Dell OptiPlex 3000,Desktop,REDE CABEADA,74-86-E2-F6-82-72,Recebido Weber,
Ingrid Valin Da Silva,Atendimento,RSADMD025,,CD557X3,Dell OptiPlex 3000,Desktop,REDE CABEADA,74-86-E2-F6-24-79,Recebido Weber,
Jenifer Kaline Almeida Varela,Atendimento,RSADMD026,Computador em Gramado,9F557X3,Dell OptiPlex 3000,Desktop,,,Ver com Pedro,
Daniela De Assis Lemos,Atendimento,RSADMD027,ver planilha Empréstimos,8B557X3,Dell OptiPlex 3000,Desktop,,,Recebido Weber,
Gabriela de Oliveira Caitano,Financeiro,RSADMD028,Home Office,GC557X3,Dell OptiPlex 3000,Desktop,,,Ver com Deiry,
Mariana Pacheco Tebacker,Atendimento,RSADMD029,,FB557X3,Dell OptiPlex 3000,Desktop,REDE CABEADA,74-86-E2-F6-81-DA,Recebido Weber,
Andreo Bouzas Oliveira,Atendimento,RSADMD030,,DD557X3,Dell OptiPlex 3000,Desktop,REDE CABEADA,74-86-E2-F6-7E-6E,Recebido Weber,
Kelly Vargas De Freitas,Backoffice,RSADMD031,,2F557X3,Dell OptiPlex 3000,Desktop,REDE CABEADA,74-86-E2-F6-29-B0,Recebido Weber,
Jade Oleszko,Backoffice,RSADMD032,,94P6H24,Dell OptiPlex 7010,Desktop,,,Recebido Weber,
Paulo de Nascimento,Coordenador Administrativo,RSADMN001,,96456V3,Dell Vostro 15 3510,Notebook,LGM_Corp,00-D7-6D-8E-36-68,Está com Lúcio,
Ana Paula Coronel,Coordenação Comercial,RSADMN002,,JXXKKW3,Dell Latitude 3420,Notebook,LGM_Corp,00-D7-6D-A8-66-32,Recebido Weber,
Vitor Silva do Couto,BI,RSADMN003,,17X9FT3,Dell Vostro 15 3510,Notebook,LGM_Corp,00-D7-6D-85-C9-92,Está com a Mariana,
Cleiton Luiz dos Reis,Cobrança e Contas a receber,RSADMN004,,CDY9FT3,Dell Vostro 15 3510,Notebook,LGM_Corp,00-D7-6D-87-40-1A,Está com Lúcio,
Anderson Oreda Gonçalves,Recursos Humanos,RSADMN006,,991Y6X3,Dell Vostro 15 3510,Notebook,LGM_Corp,00-D7-6D-5C-3C-17,Recebido Weber,
Juliane de Lima Barcellos Roldão,Controladoria,RSADMN007,,F91Y6X3,Dell Vostro 15 3510,Notebook,,,Recebido Weber,
Juliane Roldão (Em manutenção),Controladoria,RSADMN008,,H5456V3,Dell Vostro 15 3510,Notebook,LGM_Corp,00-D7-6D-8E-32-DF,Recebido Weber,
Adriane Valerio (Aguardando a devolução dos equipamentos),Controladoria,RSADMN009,,D91Y6X3,Dell Vostro 15 3510,Notebook,LGM_Corp,00-D7-6D-5C-3C-21,,
(Notebook reserva),TI,RSADMN010,,7XXKKW3,Dell Latitude 3420,Notebook,,,,
Tomaz Cardoso Mai,Atendimento,RSADMN011,,3WXKKW3,Dell Latitude 3420,Notebook,LGM_Corp,00-D7-6D-A8-5B-2E,,
Eduardo Sales Sousa,TI,RSTICN002,,P144G001,Dell Latitude 3420,Notebook,LGM_Corp,00-D7-6D-A8-4A-AD,,
,,Recebido fora do inventário,ver planilha Empréstimos,C7B6064,Dell Latitude 3540,Notebook,,,Recebido Weber,
,,Recebido fora do inventário,,D9B6064,Dell Latitude 3540,Notebook,,,Recebido Weber,sem carregador
NOME,,SERIAL,LOCAL,SETOR,CARGO - USUÁRIO,MODELO,PROCESSADOR,MEMÓRIA,HD,
RSSLVD001,,1F557X3,PEDRAS ALTAS,SALA DE VENDAS,LÍDERES-SETOR,OPTIFLEX 3000,I5-12500T,8GB,SSD - 256GB,
RSSLVD002,,29DRXW3,VITA,ADMINISTRATIVO,MENOR APRENDIZ - OPERAÇÃO 01,OPTIFLEX 3000,I5-12500T,8GB,SSD - 256GB,
RSSLVD003,,3D557X3,VITA,ADMINISTRATIVO,MENOR APRENDIZ - OPERAÇÃO 02,OPTIFLEX 3000,I5-12500T,8GB,SSD - 256GB,
RSSLVD004,,2C557X3,VITA,,,OPTIFLEX 3000,I5-12500T,8GB,SSD - 256GB,
RSSLVD005,,JB557X3,VITA,,,OPTIFLEX 3000,I5-12500T,8GB,SSD - 256GB,
RSSLVD006,,DB557X3,VITA,CENTRAL DE CONTRATOS,ADM - AYSLAN NUNES,OPTIFLEX 3000,I5-12500T,8GB,SSD - 256GB,
RSSLVD007,,5F557X3,VITA,CENTRAL DE CONTRATOS,ADM - LUIS RUFINO,OPTIFLEX 3000,I5-12500T,8GB,SSD - 256GB,
RSSLVD008,,6F557X3,RAQUEL,CENTRAL DE CONTRATOS,ADM - RAQUEL,OPTIFLEX 3000,I5-12500T,8GB,SSD - 256GB,
RSSLVD009,,7B557X3,VITA,CENTRAL DE CONTRATOS,ADM DE SALA - RAISSA BEATRIZ,OPTIFLEX 3000,I5-12500T,8GB,SSD - 256GB,
RSSLVD010,,7C557X3,VITA,PÓS VENDAS,SALA AVA,OPTIFLEX 3000,I5-12500T,8GB,SSD - 256GB,
RSSLVD011,,5D557X3,VITA,CENTRAL DE CONTRATOS,ADM - ADRIA,OPTIFLEX 3000,I5-12500T,8GB,SSD - 256GB,
RSSLVD012,,4D557X3,VITA,,,OPTIFLEX 3000,I5-12500T,8GB,SSD - 256GB,
RSSLVD013,,JC557X3,VITA,FINANCEIRO,FINANCEIRO - TADEU LEOBET (JEAN SARTORI),OPTIFLEX 3000,I5-12500T,8GB,SSD - 256GB,
RSSLVD014,,4B557X3,PÓS-VENDAS,PÓS VENDAS,PÓS VENDAS - MICHELE ROSIN,OPTIFLEX 3000,I5-12500T,8GB,SSD - 256GB,
RSSLVD015,,FD557X3,VITA,MENOR APRENDIZ,MENOR APRENDIZ - TI,OPTIFLEX 3000,I5-12500T,8GB,SSD - 256GB,
RSSLVD016,,19DRXW3,PEDRAS ALTAS,RECEPÇÃO,RECEPÇÃO PEDRAS 04,OPTIFLEX 3000,I5-12500T,8GB,SSD - 256GB,
RSSLVD017,,2D557X3,PEDRAS ALTAS,RECEPÇÃO,RECEPÇÃO PEDRAS 02,OPTIFLEX 3000,I5-12500T,8GB,SSD - 256GB,
RSSLVD018,,4KPTXW3,PEDRAS ALTAS,RECEPÇÃO,RECEPÇÃO PEDRAS 03,OPTIFLEX 3000,I5-12500T,8GB,SSD - 256GB,
RSSLVD019,,8D557X3,PEDRAS ALTAS,RECEPÇÃO,RECEPÇÃO PEDRAS 01,OPTIFLEX 3000,I5-12500T,8GB,SSD - 256GB,
RSSLVD020,,CC557X3,PEDRAS ALTAS,LIDER DE SALA,FELIPE FERNANDES,OPTIFLEX 3000,I5-12500T,8GB,SSD - 256GB,
RSSLVD021,ver planilha Empréstimos,F8DRXW3,PEDRAS ALTAS,SALA DE VENDAS,PEDRAS ALTAS - CONSULTORES/CAPTADORES,OPTIFLEX 3000,I5-12500T,8GB,SSD - 256GB,
RSSLVD022,,1G557X3,NBA,RECEPÇÃO,NBA - RECEPÇÃO NBA 01,OPTIFLEX 3000,I5-12500T,8GB,SSD - 256GB,Devolvido - estoque ADM
RSSLVD023,,FF557X3,NBA,RECEPÇÃO,NBA - RECEPÇÃO NBA 02,OPTIFLEX 3000,I5-12500T,8GB,SSD - 256GB,
RSSLVD024,,DC557X3,NBA,RECEPÇÃO,NBA - RECEPÇÃO NBA 03,OPTIFLEX 3000,I5-12500T,8GB,SSD - 256GB,
RSSLVD025,,BD557X3,NBA,SALA DE VENDAS,NBA - CONSULTORES/CAPTADORES,OPTIFLEX 3000,I5-12500T,8GB,SSD - 256GB,
RSSLVD026,,3C557X3,NBA,SALA DE VENDAS,NBA - LÍDER DE SALA II,OPTIFLEX 3000,I5-12500T,8GB,SSD - 256GB,
RSSLVD027,,1D557X3,VITA,RH,RH - GABRIELA,OPTIFLEX 3000,I5-12500T,8GB,SSD - 256GB,
RSSLVD028,,4F557X3,VITA,COMPRAS,COMPRAS - MARTA,OPTIFLEX 3000,I5-12500T,8GB,SSD - 256GB,
RSSLVD029,,FC557X3,LIVRE,ADM,ADM - SERGIO GONÇALVES,OPTIFLEX 3000,I5-12500T,8GB,SSD - 256GB,
RSSLVD030,,HD557X3,VITA,ADM,ADM - GIOVANKA,OPTIFLEX 3000,I5-12500T,8GB,SSD - 256GB,
RSSLVD031,,9C557X3,GOLDEN,LÍDER DE SALA,LÍDER DE SALA -SUZILEIA VIANA,OPTIFLEX 3000,I5-12500T,8GB,SSD - 256GB,
RSSLVD032,,GKPTXW3,GOLDEN,CONSULTORES,CONSULTORES/CAPTADORES,OPTIFLEX 3000,I5-12500T,8GB,SSD - 256GB,
RSSLVD033,,7D557X3,GOLDEN,RECEPÇÃO,RECEPÇÃO GOLDEN 01,OPTIFLEX 3000,I5-12500T,8GB,SSD - 256GB,
RSSLVD034,,9B557X3,GOLDEN,RECEPÇÃO,RECEPÇÃO GOLDEN 02,OPTIFLEX 3000,I5-12500T,8GB,SSD - 256GB,
RSSLVD035,,2G557X3,VIVERONE,RECEPÇÃO,RECEPÇÃO VIVERONE,OPTIFLEX 3000,I5-12500T,8GB,SSD - 256GB,
RSSLVD036,,BB557X3,ESTAÇÃO CANELA,RECEPÇÃO,RECEPÇÃO ESTAÇÃO 01,OPTIFLEX 3000,I5-12500T,8GB,SSD - 256GB,
RSSLVD037,,8C557X3,ESTAÇÃO CANELA,RECEPÇÃO,RECEPÇÃO ESTAÇÃO 02,OPTIFLEX 3000,I5-12500T,8GB,SSD - 256GB,
RSSLVD038,,6B557X3,DEFEITO,XXXXXXXXXXXXXXXXXX,XXXXXXXXXXXXXXXXXX,OPTIFLEX 3000,I5-12500T,8GB,SSD - 256GB,
RSSLVD039,,BC557X3,NBA,SALA DE VENDAS,CONSULTORES/CAPTADORES II,OPTIFLEX 3000,I5-12500T,8GB,SSD - 256GB,
RSSLVD040,,6C557X3,,,,OPTIFLEX 3000,I5-12500T,8GB,SSD - 256GB,
RSSLVD041,,5LG0H24,VITA,DP,DP -GABRIELA SCHNEIDER,VOSTRO 3710,I5-12400,8GB,SSD - 256GB,
RSSLVN001,,791Y6X3,DEFEITO,XXXXXXXXXXXXXXXXXX,XXXXXXXXXXXXXXXXXX,VOSTRO 15 3510,I5-1135G7,8GB,SSD - 512GB,
RSSLVN002,,C91Y6X3,NBA,LÍDER NBA,LÍDER NBA - DEBORA DRECHLER,VOSTRO 15 3510,I5-1135G7,8GB,SSD - 512GB,
RSSLVN003,,G91Y6X3,VIVERONE,LÍDER VIVERONE,LÍDER VIVERONE - ALVARO,VOSTRO 15 3510,I5-1135G7,8GB,SSD - 512GB,
RSSLVN004,,891Y6X3,PEDRO,TI,TI - PEDRO SOUSA,VOSTRO 15 3510,I5-1135G7,8GB,SSD - 512GB,
RSSLVN005,,D2Y5H24,,,,VOSTRO 15 3510,I5-1135G7,8GB,SSD - 512GB,
RSSLVN006,,C2Y5H24,PEDRAS ALTAS,JEAN,JEAN SARTORI,INSPIRION 15 3525,AMD RYZEN 5 5500U,8GB,SSD - 256GB,
RSSLVN007,,5679NZ3,VITA,FINANCEIRO,FINANCEIRO - TATIANA NARDES,VOSTRO 3510,I5-12400,8GB,SSD - 256GB,
RSSLVN008,,,VITA,CONTROLADORIA,CONTROLADORIA - GABRIELA CARVALHO,VOSTRO 3510,I5-12400,8GB,SSD - 256GB,
RSSLVN009,,J05SPY3,VITA,CONTROLADORIA,CONTROLADORIA - VINICIUS ROOS,VOSTRO 3510,I5-12400,8GB,SSD - 256GB,
RSSLVN010,,J155SPY3,PÓS-VENDAS,PÓS VENDA,PÓS VENDA - JENIFER,VOSTRO 3510,I5-12400,8GB,SSD - 256GB,
RSSLVN011,,H15SPY3 (LHM-FIN01),CHATEAU,UNIQUE,UNIQUE - GILBERTO,VOSTRO 3510,I5-12400,8GB,SSD - 256GB,
RSSLVN012,,LHM-ENG01,VITA,CENTRAL DE CONTRATOS,ANALISTA DE CONTAS - RICARDO BARBOSA,AVELL A70,I7-11800,32GB,SSD - 1TB,
RSSLVN013,,LHM-ATE07,VITA,JURÍDICO,ANALISTA FINANCEIRO - CAROLINA CAMARGO,VOSTRO 3520,I5-12400,8GB,SSD - 256GB,
RSSLVN014,,LHM-ATE04,VITA,,,VOSTRO 3520,I5-12400,8GB,SSD - 256GB,
RSSLVN015,,HJ18854,CHATEAU,UNIQUE,UNIQUE - ANA OLIVEIRA,VOSTRO15,I5-1235u,8GB,SSD - 512GB,
RSSLVN016,,CW08854,CHATEAU,UNIQUE,UNIQUE -,VOSTRO 3520,I5-1235u,8GB,SSD - 512GB,
RSSLVN017,,jx08854,VITA,CONTROLADORIA,CONTROLADORIA - BRUNO MALDONADO BARCELLOS,VOSTRO 3520,I5-1235u,8GB,SSD - 512GB,
RSSLVN018,,45nwz54,VITA,DP,DP - MARIE EDUARDA,LATITUDE 3540,I5-1235u,8GB,SSD - 512GB,
RSSLVN019,,95nwz54,VITA,JURÍDICO,JURÍDICO - ALICE DAPPER,LATITUDE 3540,I5-1235u,8GB,SSD - 512GB,
RSSLVN020,,65nwz54,CHATEAU,UNIQUE,UNIQUE -,LATITUDE 3540,I5-1235u,8GB,SSD - 512GB,
RSSLVN021,,93nwz54,CHATEAU,UNIQUE,UNIQUE -,LATITUDE 3540,I5-1235u,8GB,SSD - 512GB,
RSSLVN022,,f5nwz54,CHATEAU,UNIQUE,UNIQUE -,LATITUDE 3540,I5-1235u,8GB,SSD - 512GB,
RSADMN009,,D91Y6X3,VITA,FINANCEIRO,FINANCEIRO - PRISCILA SPORTS,VOSTRO 3510,I5 - 1135,16GB,SSD - 512GB,
RSADM026,,9F557X3,PÓS-VENDAS,PÓS VENDAS,PÓS VENDAS - JENIFER VARELA,OPTIFLEX 3000,I5-12500T,8GB,SSD - 256GB,
RSADM027,,8B557X3,RCP POS,PÓS VENDAS,PÓS VENDAS - ISABELA MENEZES,OPTIFLEX 3000,I5-12500T,8GB,SSD - 256GB,
RSSLVN023,,,NOTURNO - PEDRAS,SALA DE VENDAS,LÍDER NOTURNO - MATHEUS FERNANDES,VOSTRO 3520,I5-1235u,8GB,SSD - 512GB,
RSADMN015,,8T70W94,VITA,JURIDICO,JULIE,INSPIRION 15 3520,I5-1235u,8GB,SSD - 256GB,DEVOLVIDO 03/07/26
RSADMN016,,5BB6064,VITA,COMERCIAL,DIR. COMERCIAL - DARLAN BENETTI,LATITUDE 3540,I5-1235u,8GB,SSD - 512GB,
RSADMN017,,6T70W94,,,,INSPIRION 15 3520,I5-1235u,8GB,SSD - 256GB,
RSADMN018,,1T70W94,,,,INSPIRION 15 3520,I5-1235u,8GB,SSD - 256GB,
RSADMN019,,5T70W94,,,,,,,,
RSADMN020,,3T70W94,,,,INSPIRION 15 3520,I5-1235u,8GB,SSD - 256GB,
RSADMN021,,7T70W94,,,,INSPIRION 15 3520,I5-1235u,8GB,SSD - 256GB,
RSADMN022,,2T70W94,,,,,,,,
RSADMN023,,1WXKKW3,,,,,,,,
RSADMN024,,4T70W94,,,,,,,,
RSADMN025,,4679nz3,,,,,,,,
RSADMN026,,,VITA,FINANCEIRO,FINANCEIRO - JULIANA REIS,,,,,
RSADMN027,,ADM-CNT04,,,,,,,,
ONLINE1,,GVK6KB4,,,,,,,,
ONLINE2,,HVK6KB4,,,era usado por Alexsandra,INSPIRION 15 3520,,,,recebido Weber
ONLINE3,,1WK6KB4,,,,,,,,
ONLINE4,,2WK6KB4,,,,,,,,
COLABORADOR,SETOR,SERVICE TAG,MODELO,DESCRIÇÃO DO ITEM,OBSERVAÇÕES
Alessandra da Silva,Atendimento,48DVGR3,Dell SE2222H,Monitor,Somente 1 Tela
Alessandra da Silva,Atendimento,CN-065K5F-LO300-29G-0G03,Dell MS 116,Mouse,_
Alessandra da Silva,Atendimento,ZGDK3300034XB,Intelbras CHS 40 USB,Headset,_
Alessandra da Silva,Atendimento,CN-02883HY-LO300-2AC-09K8-A01,Dell KB 216T,Teclado,_
Alice dos Santos Dapper,Juridico,5KLVGR3,Dell SE2222H,Monitor,Tela principal
Alice dos Santos Dapper,Juridico,607SPZK01181,20M35PD-M (LG),Monitor,2° Tela.
Alice dos Santos Dapper,Juridico,ZGDK3300023JO,Intelbras CHS 40 USB,Headset,_
Alice dos Santos Dapper,Juridico,CN-065K5F-LO300-29R-09K6,Dell MS 116,Mouse,_
Ana Paula Coronel,Coordenação Comercial,5NCVGR3,Dell SE2222H,Monitor,2° Tela.
Ana Paula Coronel,Coordenação Comercial,CN-ORFV79-LO300-28A-04DZ,Dell MS 116,Mouse,_
Ana Paula Coronel,Coordenação Comercial,R4SK3202880WZ,Intelbras WHS 60 DUO,Headset,_
Anderson Oreda Gonçalves,RH,485VGR3,Dell SE2222H,Monitor,2° Tela.
Anderson Oreda Gonçalves,RH,CN-065K5F-LO300-29G-0GNK,Dell MS 116,Mouse,_
Anderson Oreda Gonçalves,RH,CN-02883HY-LO300-2AC-08EK-A01,Dell KB 216T,Teclado,_
Anderson Oreda Gonçalves,RH,ZGDK3300024V0,Intelbras CHS 40 USB,Headset,_
Andreo Bouzas Oliveira,Backoffice,607SPHG02041,20M35PD-M (LG),Monitor,Somente 1 Tela
Andreo Bouzas Oliveira,Backoffice,202306,APP TECH,Teclado,_
Andreo Bouzas Oliveira,Backoffice,CN-065K5F-LO300-29R-09LD,Dell MS 116,Mouse,_
Andreo Bouzas Oliveira,Backoffice,5HDVGR3,Dell SE2222H,Monitor,2° Tela.
Claudia Recova,Atendimento,464VGR3,Dell SE2222H,Monitor,Somente 1 Tela
Claudia Recova,Atendimento,CN-065K5F-LO300-29R-09LC,Dell MS 116,Mouse,_
Claudia Recova,Atendimento,CN-02883HY-LO300-2AC-0AWS-A01,Dell KB 216T,Teclado,_
Claudia Recova,Atendimento,ZGDK3300036D7,Intelbras CHS 40 USB,Headset,_
Cleiton Luiz dos Reis,Cobrança e Contas a receber,5KMVGR,Dell SE2222H,Monitor,2° Tela.
Cleiton Luiz dos Reis,Cobrança e Contas a receber,CN-065K5F-LO300-29G-0GMH,Dell MS 116,Mouse,_
Cleiton Luiz dos Reis,Cobrança e Contas a receber,CN-02883HY-LO300-2AC-08E9-A01,Dell KB 216T,Teclado,_
Cleiton Luiz dos Reis,Cobrança e Contas a receber,ZGDK3300029V1,Intelbras CHS 40 USB,Headset,_
Cristiane Santos,Backoffice,5HCVGR3,Dell SE2222H,Monitor,Somente 1 Tela
Cristiane Santos,Backoffice,CN-065K5F-LO300-29G-0H6O,Dell MS 116,Mouse,_
Cristiane Santos,Backoffice,CN-02883HY-LO300-2AC-09MB-A01,Dell KB 216T,Teclado,_
Daniel Barbosa De Moura,Backoffice,5HXVGR3,Dell SE2222H,Monitor,Somente 1 Tela
Daniel Barbosa De Moura,Backoffice,CN-065K5F-LO300-29G-0GLO,Dell MS 116,Mouse,_
Daniel Barbosa De Moura,Backoffice,CN-02883HY-LO300-2AC-08FI-A01,Dell KB 216T,Teclado,_
Daniela De Assis Lemos,Atendimento,46571420137,Monitor Bluecase,Monitor,Somente 1 Tela
Daniela De Assis Lemos,Atendimento,ZGDK3300028EY,Intelbras CHS 40 USB,Headset,_
Daniela De Assis Lemos,Atendimento,_,C3 TECH,Mouse,_
Daniela De Assis Lemos,Atendimento,KEY0206000014010350,APP-TECH KF100,Teclado,_
Daniele Trindade De Souza,Retenção,408AZXC0B938,LG 22MP410-B,Monitor,Somente 1 Tela
Daniele Trindade De Souza,Retenção,CN-065K5F-LO300-29G-0GMO,Dell MS 116,Mouse,_
Daniele Trindade De Souza,Retenção,CN-02883HY-LO300-2AC-06IK-A01,Dell KB 216T,Teclado,_
Daniele Trindade De Souza,Retenção,ZGDK3300039G0,Intelbras CHS 40 USB,Headset,_
Disponível,Em Estoque,CN-065K5F-LO300-29R-09KK,Dell MS 116,Mouse,_
Disponível,Em Estoque,CN-0NNP0G-PRC00-2BP-0120,Dell MORFFLUOA,Mouse,_
Disponível,Em Estoque,408AZFM0B627,LG 22MP410-B,Monitor,_
Disponível,Em Estoque,CN-065K5F-LO300-29O-0683,Dell MS 116,Mouse,_
Eduardo Sales Sousa,TI,4M4VGR3,Dell SE2222H,Monitor,2° Tela.
Eduardo Sales Sousa,TI,2411LZXBVAP8,Logitech M170,Mouse,_
Eliane Rosa de Morais,Financeiro,NBHUE6803412691876,Primetek 22H2F,Monitor,Somente 1 Tela
Eliane Rosa de Morais,Financeiro,ZGDK4200681NI,Intelbras CHS 40,Headset,_
Eliane Rosa de Morais,Financeiro,CN-02883HY-LO300-2AC-09KJ-A01,Dell KB 216T,Teclado,_
Eliane Rosa de Morais,Financeiro,CN-065K5F-LO300-28C-08AS,Dell MS 116,Mouse,_
Elisa Linhar,Atendimento,48TVGR3,Dell SE2222H,Monitor,Somente 1 Tela
Elisa Linhar,Atendimento,ZGDK420009143,Intelbras CHS 40 USB,Headset,_
Elisa Linhar,Atendimento,CN-065K5F-LO300-29R-09KT,Dell MS 116,Mouse,_
Elisa Linhar,Atendimento,CN-02883HY-LO300-2AC-09KF-A01,Dell KB 216T,Teclado,_
Emerson Santos,Atendimento,49VVGR3,Dell SE2222H,Monitor,Somente 1 Tela
Emerson Santos,Atendimento,CN-065K5F-LO300-29R-09M0,Dell MS 116,Mouse,_
Emerson Santos,Atendimento,CN-02883HY-LO300-2AC-0BF8-A01,Dell KB 216T,Teclado,_
Emerson Santos,Atendimento,ZGDK370038309,Intelbras CHS 40 USB,Headset,_
Fernanda dos Santos,DP,4HVVGR3,Dell SE2222H,Monitor, 1° Tela
Fernanda dos Santos,DP,407AZDBHH698,LG 22MP410-B,Monitor,2° Tela.
Fernanda dos Santos,DP,CN-065K5F-LO300-29G-0GLW,Dell MS 116,Mouse,_
Fernanda dos Santos,DP,CN-02883HY-LO300-2AC-09N9-A01,Dell KB 216T,Teclado,_
Gabriela de Freitas Rodrigues,Atendimento,5BDVGR3,Dell SE2222H,Monitor,Somente 1 Tela
Gabriela de Freitas Rodrigues,Atendimento,CN-065K5F-LO300-29G-0GN2,Dell MS 116,Mouse,_
Gabriela de Freitas Rodrigues,Atendimento,CN-02883HY-LO300-2AC-09MD-A01,Dell KB 216T,Teclado,_
Gabriela de Freitas Rodrigues,Atendimento,ZGDK33000371C,Intelbras CHS 40 USB,Headset,_
Gilberto da Rosa Júnior,Atendimento,2318LZBSDX8,LOGITECH M170,Mouse,_
Gilberto da Rosa Júnior,Atendimento,JN2YYR0036,LOGITECH K235,Teclado,_
Igor Kauam Dornelles França,Atendimento,CN-02883HY-LO300-2AC-0AWS-A01,Dell KB 216T,Teclado,_
Igor Kauam Dornelles França,Atendimento,5CCVGR3,Dell SE2222H,Monitor,Somente 1 Tela
Igor Kauam Dornelles França,Atendimento,ZGDK4200630NA,Intelbras CHS 40 USB,Headset,_
Igor Kauam Dornelles França,Atendimento,CN-065K5F-LO300-29G-0GLD,Dell MS 116,Mouse,_
Ingrid Valin Da Silva,Atendimento,5LCVGR3,Dell SE2222H,Monitor,Somente 1 Tela
Ingrid Valin Da Silva,Atendimento,CN-065K5F-LO300-29R-09LE,Dell MS 116,Mouse,_
Ingrid Valin Da Silva,Atendimento,CN-02883HY-LO300-2AC-0BFB-A01,Dell KB 216T,Teclado,_
Ingrid Valin Da Silva,Atendimento,EANJ0301571OR,Intelbras CHS 40 USB,Headset,_
Ingryd Pacheco Dilsson,Cobrança,48VVGR3,Dell SE2222H,Monitor,Somente 1 Tela
Ingryd Pacheco Dilsson,Cobrança,CN-065K5F-LO300-29G-0GLE,Dell MS 116,Mouse,_
Ingryd Pacheco Dilsson,Cobrança,CN-02883HY-LO300-2AC-09KL-A01,Dell KB 216T,Teclado,_
Ingryd Pacheco Dilsson,Cobrança,ZGDK3300031XE,Intelbras CHS 40 USB,Headset,_
Jade Oleszko,Backoffice,92B7XT3,Dell SE2222HSF,Monitor,_
Jade Oleszko,Backoffice,CN-065K5F-LO300-3AO-068P,Dell MS 116,Mouse,_
Jade Oleszko,Backoffice,CN-02883HY-LO300-2AF-G4AK-A02,Dell KB 216T,Teclado,_
Jenifer Kaline Almeida Varela,Atendimento,46571420139,Monitor Bluecase,Monitor,Somente 1 Tela está em Gramado
Juan Davi Vidal Borges,Backoffice,5JLVGR3,Dell SE2222H,Monitor,Somente 1 Tela
Juan Davi Vidal Borges,Backoffice,CN-0RFV79-LO300-28A-04I8,Dell MS 116,Mouse,_
Juan Davi Vidal Borges,Backoffice,CN-02883HY-LO300-2AC-0AX0-A01,Dell KB 216T,Teclado,_
Juliana Vieira,Cobrança,5CLVGR3,Dell SE2222H,Monitor,Somente 1 Tela
Juliana Vieira,Cobrança,CN-065K5F-LO300-29G-0GN2,Dell MS 116,Mouse,_
Juliana Vieira,Cobrança,CN-02883HY-LO300-2AC-09MD-A01,Dell KB 216T,Teclado,_
Juliana Vieira,Cobrança,Não foi possível visualizar o NS,Intelbras CHS 40 USB,Headset,Não foi possível visualizar o NS
Juliane Roldão,Controladoria,5L4VGR3,Dell SE2222H,Monitor,2° Tela.
Karine Dornelles,Cobrança,5JMVGR3,Dell SE2222H,Monitor,Somente 1 Tela
Karine Dornelles,Cobrança,CN-065K5F-LO300-29G-0GM6,Dell MS 116,Mouse,_
Karine Dornelles,Cobrança,CN-02883HY-LO300-2AC-06NA-A01,Dell KB 216T,Teclado,_
Karine Dornelles,Cobrança,ZGDK3300040IT,Intelbras CHS 40 USB,Headset,_
Kelly Vargas De Freitas,Backoffice,B8N7XT3,Dell SE2222HSF,Monitor,_
Kelly Vargas De Freitas,Backoffice,CN-065K5F-LO300-290-067O,Dell MS 116,Mouse,_
Kelly Vargas De Freitas,Backoffice,CN-02883HY-LO300-3B4-0CZ8-A04,Dell KB 216T,Teclado,_
Laura Rosa Lattuada,Contas a receber,5M5VGR3,Dell SE2222H,Monitor,Tela principal
Laura Rosa Lattuada,Contas a receber,5J4VGR3,Dell SE2222H,Monitor,2° Tela.
Laura Rosa Lattuada,Contas a receber,2WGVFR,Polly BW 3210,Headset,_
Laura Rosa Lattuada,Contas a receber,CN-065K5F-LO300-3AO-07VQ,Dell MS 116,Mouse,_
Laura Rosa Lattuada,Contas a receber,CN-02883HY-LO300-3B4-0DEX-A04,Dell KB 216T,Teclado,_
Luciano Sitnievski Júnior,Cobrança,SRWVGR3,Dell SE2222H,Monitor,Somente 1 Tela
Luciano Sitnievski Júnior,Cobrança,CN-065K5F-LO300-29R-09KK,Dell MS 116,Mouse,_
Luciano Sitnievski Júnior,Cobrança,CN-02883HY-LO300-2AC-06HX-A01,Dell KB 216T,Teclado,_
Luciano Sitnievski Júnior,Cobrança,ZGDK3300038LZ,Intelbras CHS 40 USB,Headset,_
Marcus Vinicius Freitas,Financeiro,85285200,"Monitor 19.5"" LCD VGA/HDMI Lenovo",Monitor,Home Office
Mariana Pacheco Tebacker,Atendimento,CN-065K5F-LO300-29G-0GN7,Dell MS 116,Mouse,_
Mariana Pacheco Tebacker,Atendimento,CN-02883HY-LO300-2AC-06KT-A01,Dell KB 216T,Teclado,_
Mariana Pacheco Tebacker,Atendimento,ZGDK3300026WV,Intelbras CHS 40 USB,Headset,_
Mariana Pacheco Tebacker,Atendimento,SKDVVGR3,Dell SE2222H,Monitor,Somente 1 Tela
Paulo de Nascimento,Coordenador Administrativo,5KVVGR3 ,Dell SE2222H,Monitor,2° Tela.
Paulo de Nascimento,Backoffice,CN-065K5F-LO300-29G-0G9Q,Dell MS 116,Mouse,_
Paulo de Nascimento,Backoffice,ZGDR3300025L7,Intelbras CHS 40 USB,Headset,_
Paulo de Nascimento,Backoffice,CN-02883HY-LO300-2AC-06MR-A01,Dell KB 216T,Teclado,_
Priscila Camargo de Brito,Financeiro,5JWVGR3,Dell SE2222H,Monitor,_
Rafael Alexandre Michalski,Retenção,408AZGF0B951,LG 22MP410-B,Monitor,Somente 1 Tela
Rafael Alexandre Michalski,Retenção,CN-065K5F-LO300-29R-09LJ,Dell MS 116,Mouse,_
Rafael Alexandre Michalski,Retenção,PO:202401,APP-TECH KF100,Teclado,_
Rafael Alexandre Michalski,Retenção,ZGDK3300030OM,Intelbras CHS 40 USB,Headset,_
Renata da Silva,Contas a receber,5GZVGR,Dell SE2222H,Monitor,Tela principal
Renata da Silva,Contas a receber,607SPXV01602,20M35PD-M (LG),Monitor,2° Tela.
Renata da Silva,Contas a receber,CN-02883HY-LO300-29G-0GO8,Dell MS 116,Mouse,_
Renata da Silva,Contas a receber,CN-065K5F-LO300-0AWO-0GLE,Dell KB 216T,Teclado,_
Renata da Silva,Contas a receber,ZGDK3300033FP,Intelbras CHS 40 USB,Headset,_
Sara Ingred Silva Germano,Financeiro,NAHUE6804110680014,Primetek 22H2F,Monitor,Somente 1 Tela
Sara Ingred Silva Germano,Financeiro,202306,APP TECH MF250,Mouse,_
Sara Ingred Silva Germano,Financeiro,2342SC31WS18,LOGITECH K120,Teclado,_
Thais Santos do Nascimento,Atendimento,607SPZK01229,20M35PD-M (LG),Monitor,Somente 1 Tela
Thais Santos do Nascimento,Atendimento,EANJ03000370D2,Intelbras CHS 40 USB,Headset,_
Thais Santos do Nascimento,Atendimento,CN-02883HY-LO300-2AC-09KJ-A01,Dell KB 216T,Teclado,_
Thais Santos do Nascimento,Atendimento,CN-065K5F-LO300-28A-04ID,Dell MS 116,Mouse,_
Tomaz Cardoso Mai,Atendimento,607SPSL01182,20M35PD-M (LG),Monitor,2° Tela.
Tomaz Cardoso Mai,Atendimento,CN-065K5F-LO300-28A-04GM,Dell MS 116,Mouse,_
Tomaz Cardoso Mai,Atendimento,CN-02883HY-LO300-2AC-09MD-A01,Dell KB 216T,Teclado,_
Vitor Silva do Couto,BI,CN-065K5F-LO300-29R-09LW,Dell MS 116,Mouse,_
Viviane da Silva,Backoffice,4G4VGR3,Dell SE2222H,Monitor,2° Tela.
Viviane da Silva,Backoffice,4G5VGR3,Dell SE2222H,Monitor, 1° Tela
Viviane da Silva,Backoffice,CN-065K5F-LO300-29G-0GLU,Dell MS 116,Mouse,_
Viviane da Silva,Backoffice,CN-02883HY-LO300-2AC-09K8-A01,Dell KB 216T,Teclado,_
MARCA,MODELO,HOSTNAME,SERVICE TAG,DESCRIÇÃO DO ITEM,OBSERVAÇÕES
FORTINET,FORTIGATE 40F,FW-LGM-MATRIZ-01,TWZH JGRU,FIREWALL,Devolvido Xtreme
FORTINET,FORTIGATE 40F,FW-LGM-MATRIZ-02,RM8W QBDS,FIREWALL,Devolvido Xtreme
ARUBA,INSTANT ON 1930 SWITCH,SW-LGM-MATRIZ-01,TW1AKPD47L,SWITCH,Gramado TI
ARUBA,INSTANT ON 1930 SWITCH,SW-LGM-MATRIZ-02,TW1AKPD47B,SWITCH,Gramado TI
INTELBRAS,MULTI HD MHDX 1208 - AM,_,K75K4602355TT,SISTEMA DVR,Com Pedro POA
INTELBRAS,XNB 18000 120V,_,Y84L2100004Z2,NOBREAK,Gramado TI
HP,SERVIDOR PROLIANT ML110 GEN9,_,BRC6418778,SERVIDOR LOCAL,Gramado TI
UNIFI,UCK-G2-PLUS,_,SWX-UCKG2P,CONTROLADORA WI-FI,Gramado TI
UNIFI ,U6-PRO,_,SWX-U6PROR,ACCESS POINT,Gramado TI
UNIFI,U6-PRO,_,SWX-U6PROR,ACCESS POINT,Gramado TI
FURAKAWA,5E,_,_,4 UNIDADE DE PATCH PANEL 24 PORTAS,Descartado
FURAKAWA,6E,_,_,1 UNIDADE DE PATCH PANEL 24 PORTAS,Descartado
CLARO,CH8568,_,*723054049152*,ROTEADOR DA CLARO,EQUIPAMENTO PERTENCE A CLARO
HPE,MSR954,_,CN06HB1481,ROTEADOR DA VIVO,EQUIPAMENTO PERTENCE A VIVO
BLUCASTLE,BC-ONT1B,_,BLCAE2015196,TERMINAL (ONT),EQUIPAMENTO PERTENCE A VIVO
SOLICITANTE,SETOR,ITEM,MODELO,SERVICE TAG,OBSERVAÇÕES,OBSERVAÇÕES 2,Periféricos,Devolução
Duda (Dinael),DP,MONITOR,DELL SE2222H,5J4VGR3,Autorização Email Darlan / Chris (18/08),,,Devolvido 13/04/26
Duda (Ana Flavia),DP,MONITOR,DELL SE2222H,4G4VGR3,Autorização Email Darlan / Chris (18/08),,,Devolvido 13/04/26
Duda (Natielen),DP,MONITOR,DELL SE2222H,5CCVGR3,Autorização Email Darlan / Chris (18/08),,,Devolvido 13/04/26
Duda (Amanda),DP,MONITOR,DELL SE2222H,5KMVGR3,Autorização Email Darlan / Chris (18/08),,,Devolvido 28/04/26
Duda,DP,MONITOR,DELL SE2222H,5CLVGR3,Autorização Email Darlan / Chris (03/09),,,Devolvido 28/04/26
Duda,DP,MONITOR,DELL SE2222H,5HDVGR3,Autorização Email Darlan / Chris (03/09),,,Devolvido 28/04/26
Duda,DP,MONITOR,DELL SE2222H,464VGR3,Autorização Email Darlan / Chris (03/09),,,Devolvido 28/04/26
Ana (Unique),Unique LGM,MONITOR,DELL SE2222H,5KVVGR3,Autorizado Darlan (03/09),,,
Ana (Unique),Unique LGM,MONITOR,DELL SE2222H,5M5VGR3,Autorizado Darlan (03/09),,,
Ana (Unique),Unique LGM,MONITOR,DELL SE2222H,5BDVGR3,Autorizado Darlan (03/09),,,
Ana (Unique),Unique LGM,MONITOR,DELL SE2222H,48TVGR3,Autorizado Darlan (03/09),,,
Ana (Unique),Unique LGM,MONITOR,DELL SE2222H,4G5VGR3,Autorizado Darlan (03/09),,,
Ana (Unique),Unique LGM,MONITOR,DELL SE2222H,5JKVGR3,Autorizado Darlan (03/09),,,
Ana (Unique),Unique LGM,MONITOR,DELL SE2222H,5GZVGR3,Autorizado Darlan (03/09),,,
Carina (Vendas),Front,Desktop,Dell Optiplex 3000,GF557X3,Autorizado Darlan Whats (17/09),,kit completo,
Carina (Vendas),Front,Desktop,Dell Optiplex 3000,DF557X3,Autorizado Darlan Whats (17/09),,kit completo,
Sueli (Pós Vendas),Pós Vendas,Desktop,Dell Optiplex 3000,4G557X3,Pós Vendas - Sala AVA,,kit completo,não foi usado
Darlan,Canela Emp,Desktop,Dell Optiplex 3000,6G557X3,Autorizado Darlan email (26/09),,kit completo,
Ana Rocha (Unique),Unique LGM,Desktop,Dell Optiplex 3000,F8DRXW3,Unique - email (17/09),,kit completo,
Ana Rocha (Unique),Unique LGM,Desktop,Dell Optiplex 3000,5C557X3,Unique - email (17/09),,kit completo,
Ana Rocha (Unique),Unique LGM,Desktop,Dell Optiplex 3000,8B557X3,Unique - email (17/09),,kit completo,
Ana Rocha (Unique),Unique LGM,Notebook,Dell Latitude 3540,C7B6064,Unique - email (17/09),,"""+ kit completo""",
Felipe Mattos (Vendas),Front,Desktop,Dell Optiplex 3000,JD557X3,Email 01/10,,"""+ kit completo""",não foi usado
Stefani (ADM),MKT - Digital,Monitor,LG 22MP410,408AZXC0B938,Solicitação e-mail (08/10),,,Devolvido 17/04/26
Elaine (Vendas),Front,Desktop,Dell Optiplex 3000,CF557X3,Solicitação e-mail (23/10),,kit completo + monitor,
Elaine (Vendas),Front,Desktop,Dell Optiplex 3000,JD557X3,Solicitação e-mail (23/10),,kit completo,Devolvido 12/05/26
Elaine (Vendas),Front,Monitor,DELL SE2222H,5KDVGR3,Solicitação e-mail (23/10),,kit completo,
Elaine (Vendas),Front,Monitor,DELL SE2222H,48VVGR3,Solicitação e-mail (23/10),,kit completo,
Isabela (Pós Vendas),Pós Vendas,Desktop,Dell Optiplex 3000,4G557X3,Solicitação e-mail (07/11),,kit completo,não foi usado
Isabela (Pós Vendas),Pós Vendas,Monitor,DELL SE2222H,,Solicitação e-mail (07/11),,4 headsets,
Aline Gil (Juridico),Juridico,Notebook,Dell Vostro 3510,7JXXXT3,Solicitação - email (12/11),,"""+ teclado / mouse""",
Aline Gil (Juridico),Juridico,Notebook,Dell Vostro 3510,991YCX3,Solicitação - email (12/11),,"""+ teclado / mouse""",
Stefani,,,,D9B6064,substitui notebook problema,,,
Priscila,Cobrança,Monitor,DELL SE2222H,5J4VGR3,Solicitação - email (02/04),,,
Marcelo,Retenção,Monitor,LG 22MP410,408AZXC0B938,Solicitação - email (13/04),,,
Marcelo,Retenção,Monitor,DELL SE2222H,4G4VGR3,Solicitação - email (13/04),,,
Marcelo,Retenção,Monitor,DELL SE2222H,5CCVGR3,Solicitação - email (13/04),,,
Marcelo,Retenção,Monitor,DELL SE2222H,5HCVGR3,Solicitação - email (13/04),,,
Marcelo,Retenção,Monitor,DELL SE2222H,48DVGR3,Solicitação - email (13/04),,,
Marcelo,Retenção,Desktop,Dell Optiplex 3000,7D557X3,Solicitação - email (13/04),,,
Priscila,Cobrança,Monitor,DELL SE2222H,5CCVGR3,Solicitação - email (31/03),,,
Isabela (Pós Vendas),Pós Venda,Desktop,Dell Optiplex 3000,3F557X3,Solicitação - email (28/04),,kit completo,
Isabela (Pós Vendas),Pós Venda,Desktop,Dell Optiplex 3000,9B557X3,Solicitação - email (28/04),,kit completo,
Isabela (Pós Vendas),Pós Venda,Monitor,DELL SE2222H,5KMVGR3,Solicitação - email (28/04),,,
Isabela (Pós Vendas),Pós Venda,Monitor,DELL SE2222H,464VGR3,Solicitação - email (28/04),,,
Marcelo - TV Sala,Pós Venda,Desktop,Dell Optiplex 3000,8F557X3,Solicitação Pedro (12/05),,,
Rafa,Juridico,Notebook,Dell Latitude 342,JXXKKW3,,,,
Rafaela Wingert,RH,Monitor,DELL SE2222H,5KMVGR3,Solicitação Pedro (29/05),,,
André (Vitor),Estrategico,Monitor,DELL SE2222H,464VGR3,Empréstimo até chegar novo,,,devolvido em 10/07/26
André (Vitor),Estrategico,Monitor,E2225HSM,HSP3BJ4,Solicitação André (27/05),,,
Stephany,Unique,Monitor,DELL SE2222H,5JMVGR3,Solicitação Email (18/05),,,
Stephany,Unique,Monitor,DELL SE2222H,464VGR3,Solicitação Email (18/05),,,
Ana Rocha (Unique),Unique,Desktop,Dell Optiplex 3000,HF557X3,Solicitação Email,,kit completo,
Ana Rocha (Unique),Unique,Desktop,Dell Optiplex 3000,1C557X3,Solicitação Email,,kit completo,
Ana Rocha (Unique),Unique,Desktop,Dell Optiplex 3000,5G557X3,Solicitação Email,,kit completo,
Lucio,RH/DP,Notebook,Dell Vostro 3510,H5456V3,"Era usado pelo Lucio, disponibilizado à equipe",,,
Pedro,Juridico,Desktop,Dell Optiplex 3000,4C557X3,E-mail 04/08 - Arthur / Pedro,entregues sem mapeio de Serial x Setor,kit completo,
Pedro,Controladoria,Desktop,Dell Optiplex 3000,7G557X3,E-mail 04/08 - Arthur / Pedro,entregues sem mapeio de Serial x Setor,kit completo,
Pedro,CAR,Desktop,Dell Optiplex 3000,GF557X3,E-mail 04/08 - Arthur / Pedro,entregues sem mapeio de Serial x Setor,kit completo,
Pedro,Unique,Desktop,Dell Optiplex 3000,JD557X3,E-mail 04/08 - Arthur / Pedro,entregues sem mapeio de Serial x Setor,kit completo,
Pedro,Unique,Desktop,Dell Optiplex 3000,CF557X3,E-mail 04/08 - Arthur / Pedro,entregues sem mapeio de Serial x Setor,kit completo,
,,Desktop,Dell Optiplex 3000,9D557X3,E-mail 04/08 - Arthur / Pedro,entregues sem mapeio de Serial x Setor,kit completo,
Pedro,Jurídico,Notebook,Del Inspiron 15 3520,8T70W94,Solicitação Whatsapp 13/10/2226,,,`;

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i+1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += c;
    }
  }
  result.push(current.trim());
  return result;
}

const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

let currentSection = 'GRAMADO_COMPUTADORES';
const computadores = [];
const perifericos = [];
const rede = [];
const emprestimos = [];

let idCounter = 1;

for (let line of lines) {
  const cols = parseCSVLine(line);
  if (cols.length === 0) continue;

  if (cols[0] === 'NOME' && cols[2] === 'SERIAL') {
    currentSection = 'SALAS_VENDAS';
    continue;
  }
  if (cols[0] === 'COLABORADOR' && cols[2] === 'SERVICE TAG' && cols[3] === 'MODELO') {
    currentSection = 'PERIFERICOS';
    continue;
  }
  if (cols[0] === 'MARCA' && cols[1] === 'MODELO' && cols[2] === 'HOSTNAME') {
    currentSection = 'REDE';
    continue;
  }
  if (cols[0] === 'SOLICITANTE' && cols[2] === 'ITEM') {
    currentSection = 'EMPRESTIMOS';
    continue;
  }

  // Pula cabeçalhos repetidos
  if (cols[0] === 'COLABORADOR' && cols[1] === 'SETOR' && cols[2] === 'HOSTNAME') continue;

  if (currentSection === 'GRAMADO_COMPUTADORES') {
    const [colaborador, setor, hostname, obs, serviceTag, modelo, desc, wifi, mac, nota] = cols;
    if (!serviceTag && !hostname && !colaborador) continue;
    computadores.push({
      id: 'eq-' + (idCounter++),
      tipo: (desc && desc.toLowerCase().includes('notebook')) || (modelo && modelo.toLowerCase().includes('vostro')) || (modelo && modelo.toLowerCase().includes('latitude')) ? 'Notebook' : 'Desktop',
      hostname: hostname || '',
      serviceTag: serviceTag || '',
      modelo: modelo || '',
      responsavel: colaborador || '',
      setor: setor || '',
      local: 'Gramado - Matriz',
      wifi: wifi || '',
      mac: mac || '',
      obs: [obs, nota].filter(Boolean).join(' | '),
      status: (obs && obs.toLowerCase().includes('manutenção')) ? 'manutencao' : (colaborador && colaborador.toLowerCase().includes('reserva')) ? 'estoque' : colaborador ? 'em_uso' : 'estoque',
      origem: 'Inventário Gramado'
    });
  } else if (currentSection === 'SALAS_VENDAS') {
    const [nome, vazio, serial, local, setor, cargoUsuario, modelo, cpu, ram, hd, obs] = cols;
    if (!serial && !nome) continue;
    computadores.push({
      id: 'eq-' + (idCounter++),
      tipo: (modelo && modelo.toLowerCase().includes('vostro')) || (nome && nome.includes('LVN')) ? 'Notebook' : 'Desktop',
      hostname: nome || '',
      serviceTag: serial || '',
      modelo: modelo || '',
      responsavel: cargoUsuario || '',
      setor: setor || '',
      local: local || 'Salas de Vendas',
      cpu: cpu || '',
      ram: ram || '',
      disco: hd || '',
      obs: obs || '',
      status: (local && local.toLowerCase().includes('defeito')) ? 'defeito' : (obs && obs.toLowerCase().includes('devolvido')) ? 'estoque' : cargoUsuario ? 'em_uso' : 'estoque',
      origem: 'Salas de Vendas'
    });
  } else if (currentSection === 'PERIFERICOS') {
    const [colaborador, setor, serviceTag, modelo, tipo, obs] = cols;
    if (!serviceTag && !modelo) continue;
    perifericos.push({
      id: 'perif-' + (idCounter++),
      tipo: tipo || 'Periférico',
      serviceTag: serviceTag || '',
      modelo: modelo || '',
      responsavel: colaborador || '',
      setor: setor || '',
      obs: obs && obs !== '_' ? obs : '',
      status: (colaborador && colaborador.toLowerCase().includes('disponível')) ? 'estoque' : 'em_uso'
    });
  } else if (currentSection === 'REDE') {
    const [marca, modelo, hostname, serviceTag, tipo, obs] = cols;
    if (!modelo && !hostname) continue;
    rede.push({
      id: 'net-' + (idCounter++),
      marca: marca || '',
      modelo: modelo || '',
      hostname: hostname && hostname !== '_' ? hostname : '',
      serviceTag: serviceTag || '',
      tipo: tipo || 'Equipamento de Rede',
      obs: obs || '',
      status: (obs && obs.toLowerCase().includes('descartado')) ? 'descartado' : 'ativo'
    });
  } else if (currentSection === 'EMPRESTIMOS') {
    const [solicitante, setor, item, modelo, serviceTag, obs1, obs2, perif, devolucao] = cols;
    if (!solicitante && !serviceTag) continue;
    emprestimos.push({
      id: 'emp-' + (idCounter++),
      solicitante: solicitante || '',
      setor: setor || '',
      tipo: item || '',
      modelo: modelo || '',
      serviceTag: serviceTag || '',
      observacoes: [obs1, obs2, perif].filter(Boolean).join(' | '),
      devolucao: devolucao || '',
      status: devolucao ? 'devolvido' : 'ativo'
    });
  }
}

const db = {
  config: {
    sheetUrl: 'https://docs.google.com/spreadsheets/d/1csJp1tntBnpDa80OPt8TpRiaYgoPrJhQ/edit?usp=sharing',
    lastSync: new Date().toISOString()
  },
  computadores,
  perifericos,
  rede,
  emprestimos
};

const targetPath = path.join('c:', 'chamados', 'dados', 'inventario.json');
fs.writeFileSync(targetPath, JSON.stringify(db, null, 2), 'utf8');

console.log('Inventário gerado com sucesso!');
console.log('Computadores:', computadores.length);
console.log('Periféricos:', perifericos.length);
console.log('Equipamentos de Rede:', rede.length);
console.log('Empréstimos:', emprestimos.length);
