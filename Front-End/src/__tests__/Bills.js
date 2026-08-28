/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom"
import BillsUI from "../pages/Bills/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import { getBills } from "../pages/Bills/Bills.js"

import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))

    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })
})

describe("Given I am connected as an employee", () => {
  describe("When I call getBills with a valid store", () => {
    test("Then it should return bills with formatted date and status", async () => {

      const mockStore = {
        bills: () => ({
          list: () => Promise.resolve([
            {
              id: "1",
              date: "2023-04-04",
              status: "pending"
            },
            {
              id: "2",
              date: "2023-01-01",
              status: "accepted"
            }
          ])
        })
      }

      const result = await getBills(mockStore)

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe("1")
      expect(result[0].date).not.toBe("2023-04-04") // la date a été reformatée
      expect(result[0].status).not.toBe("pending")   // le statut a été reformaté
    })
  })
})

describe("When I call getBills without a store", () => {
  test("Then it should return an empty array", async () => {
    const result = await getBills(undefined)
    expect(result).toEqual([])
  })
})

describe("When I call getBills and the API returns an error", () => {
  test("Then it should throw the error", async () => {
    const mockStore = {
      bills: () => ({
        list: () => Promise.reject(new Error("Erreur 404"))
      })
    }

    await expect(getBills(mockStore)).rejects.toThrow("Erreur 404")
  })
})

describe("When I call getBills and the API returns a 500 error", () => {
  test("Then it should throw the error", async () => {
    const mockStore = {
      bills: () => ({
        list: () => Promise.reject(new Error("Erreur 500"))
      })
    }

    await expect(getBills(mockStore)).rejects.toThrow("Erreur 500")
  })
})