/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom"
import BillsUI from "../pages/Bills/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH } from "../constants/routes.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import mockStore from "../__mocks__/store"
import { getBills, initBillsPage } from "../pages/Bills/Bills.js"

import router from "../app/Router.js"

jest.mock("../app/store", () => mockStore)

afterEach(() => {
  jest.clearAllMocks()
})

beforeAll(() => {
  window.bootstrap = {
    Modal: jest.fn().mockImplementation(() => ({
      show: jest.fn()
    }))
  }

  window.fetch = jest.fn().mockResolvedValue({
    blob: () => Promise.resolve(new Blob(["fake file content"]))
  })

  window.URL.createObjectURL = jest.fn().mockReturnValue("blob:fake-url")
  window.URL.revokeObjectURL = jest.fn()
})

describe("Given I am a user connected as an employee", () => {

    describe("When I am on Bills Page", () => {
      test("Then bill icon in vertical layout should be highlighted", async () => {
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock
        })

        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee"
          })
        )

        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.append(root)

        router()
        window.onNavigate(ROUTES_PATH.Bills)

        await waitFor(() => screen.getByTestId("icon-window"))
        expect(screen.getByTestId('icon-window').classList.contains('active-icon')).toBeTruthy()
      })

      test("Then bills should be ordered from earliest to latest", () => {
        document.body.innerHTML = BillsUI({ data: bills })

        const dates = screen
          .getAllByText(
            /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
          )
          .map(a => a.innerHTML)

        const antiChrono = (a, b) => (a < b ? 1 : -1)
        const datesSorted = [...dates].sort(antiChrono)

        expect(dates).toEqual(datesSorted)
      })
    })

    describe("When I call getBills with a valid store", () => {
      test("Then it should return bills with formatted date and status", async () => {
        const mockStore = {
          bills: () => ({
            list: () =>
              Promise.resolve([
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
        expect(result[0].date).not.toBe("2023-04-04")
        expect(result[0].status).not.toBe("pending")
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

    describe("When I am on Bills page and I click on the new bill button", () => {
      test("Then it should navigate to NewBill page", () => {
        document.body.innerHTML = BillsUI({ data: bills })

        const onNavigate = jest.fn()

        initBillsPage({
          document,
          onNavigate,
          store: null,
          localStorage: window.localStorage
        })

        const buttonNewBill = screen.getByTestId("btn-new-bill")

        fireEvent.click(buttonNewBill)

        expect(onNavigate).toHaveBeenCalledWith(
          ROUTES_PATH["NewBill"]
        )
      })
    })

    describe("When I am on Bills page and I click on the eye icon", () => {
      test("Then a modal should open", () => {
        document.body.innerHTML = BillsUI({ data: bills })

        initBillsPage({
          document,
          onNavigate: jest.fn(),
          store: null,
          localStorage: window.localStorage
        })

        const iconEye = screen.getAllByTestId("icon-eye")[0]

        fireEvent.click(iconEye)

        expect(window.bootstrap.Modal).toHaveBeenCalled()
      })
    })

    describe("When I am on Bills page and I click on the download icon", () => {
      test("Then the file should be downloaded", async () => {
        document.body.innerHTML = BillsUI({ data: bills })

        initBillsPage({
          document,
          onNavigate: jest.fn(),
          store: null,
          localStorage: window.localStorage
        })

        const iconDownload = screen.getAllByTestId("icon-download")[0]

        fireEvent.click(iconDownload)

        await waitFor(() => {
          expect(window.fetch).toHaveBeenCalled()
      })
      })
    })

    describe("When I navigate to Bills", () => {
      test("Then it fetches bills from mock API GET and displays them", async () => {
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock
        })

        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
            email: "employee@test.tld"
        })
      )

      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.innerHTML = ""
      document.body.append(root)

      router()

      window.onNavigate(ROUTES_PATH.Bills)

      await waitFor(() => {
          expect(screen.getByText("Mes notes de frais")).toBeTruthy()
      })

      expect(screen.getByText(bills[0].name)).toBeTruthy()
      })
    })
})