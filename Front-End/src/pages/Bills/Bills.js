import { ROUTES_PATH } from '../../constants/routes.js'
import { formatDate, formatStatus } from "../../app/format.js"
import Logout from "../../components/Logout.js"

/**
 * Initialise la page Bills - Attache les event listeners
 */
export const initBillsPage = ({ document, onNavigate, store, localStorage }) => {
  // Bouton "Nouvelle note de frais"
  const buttonNewBill = document.querySelector(`button[data-testid="btn-new-bill"]`)
  if (buttonNewBill) {
    buttonNewBill.addEventListener('click', () => {
      onNavigate(ROUTES_PATH['NewBill'])
    })
  }

  // Icônes "oeil" pour voir les justificatifs
  const iconEyes = document.querySelectorAll(`div[data-testid="icon-eye"]`)
  if (iconEyes) {
    iconEyes.forEach(icon => {
      icon.addEventListener('click', () => {
        handleClickIconEye(icon, document)
      })
    })
  }

   // Icônes "télécharger" pour télécharger les justificatifs
  const iconDownloads = document.querySelectorAll(`div[data-testid="icon-download"]`)
  if (iconDownloads) {
    iconDownloads.forEach(icon => {
      icon.addEventListener('click', () => {
        handleClickIconDownload(icon)
      })
    })
  }

  // Initialise le bouton de déconnexion
  new Logout({ document, localStorage, onNavigate })
}

/**
 * Gère le clic sur l'icône oeil - Ouvre la modale avec l'image
 */
const handleClickIconEye = (icon, document) => {
  const billUrl = icon.getAttribute("data-bill-url")
  const modaleFile = document.querySelector('#modaleFile')
  const modal = new bootstrap.Modal(modaleFile)

  // Attendre que la modale soit visible pour calculer la largeur
  modaleFile.addEventListener('shown.bs.modal', () => {
    const imgWidth = Math.floor(modaleFile.getBoundingClientRect().width * 0.5)
    modaleFile.querySelector(".modal-body").innerHTML =
      `<div style='text-align: center;' class="bill-proof-container">
        <img width=${imgWidth} src=${billUrl} alt="Bill" />
      </div>`
  }, { once: true })

  modal.show()
}

/**
 * Gère le clic sur l'icône télécharger
 */
const handleClickIconDownload = async (icon) => {
  const billUrl = icon.getAttribute("data-bill-url")
  const fileName = icon.getAttribute("data-file-name")

  try {
    const response = await fetch(billUrl)
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Erreur lors du téléchargement:', error)
  }
}

/**
 * Récupère les bills depuis le store
 */
export const getBills = async (store) => {
  if (!store) return []

  try {
    const snapshot = await store.bills().list()
    snapshot.sort((a, b) => new Date(b.date) - new Date(a.date))

    const bills = snapshot.map(doc => {
      try {
        return {
          ...doc,
          date: formatDate(doc.date),
          status: formatStatus(doc.status)
        }
      } catch (e) {
        // Si les données sont corrompues, on garde la date non formatée
        console.log(e, 'for', doc)
        return {
          ...doc,
          date: doc.date,
          status: formatStatus(doc.status)
        }
      }
    })

    return bills
  } catch (error) {
    console.error('Error fetching bills:', error)
    throw error
  }
}
