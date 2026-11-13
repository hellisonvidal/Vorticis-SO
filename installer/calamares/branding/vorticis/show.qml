import QtQuick 2.0
import calamares.slideshow 1.0

// Apresentação exibida enquanto o Vorticis SO é instalado: o vórtice gira
// enquanto os textos mostram o que o sistema oferece.
Presentation {
    id: apresentacao
    property var textos: [
        "Bem-vindo ao Vorticis SO — leve, bonito e seu.",
        "Apps de Windows, Linux e Android lado a lado: dê dois cliques no instalador e pronto.",
        "12 temas e um ícone que acompanha o tema — ou que você escolhe do seu jeito.",
        "Vorticis Music, Vorticis Video e a Central de Apps já vêm prontos para usar.",
        "Drivers e firmware atualizados automaticamente no primeiro boot.",
        "Firewall ativo, DNS criptografado e contas com níveis de acesso desde o primeiro minuto."
    ]
    Timer { interval: 6000; running: apresentacao.activatedInCalamares; repeat: true; onTriggered: apresentacao.goToNextSlide() }
    Repeater {
        model: apresentacao.textos
        Slide {
            Rectangle { anchors.fill: parent; gradient: Gradient {
                GradientStop { position: 0.0; color: "#0d78c4" } GradientStop { position: 1.0; color: "#021a3d" } } }
            Image {
                id: logo
                source: "logo.png"
                width: 128; height: 128
                anchors.horizontalCenter: parent.horizontalCenter
                anchors.bottom: texto.top; anchors.bottomMargin: 28
                smooth: true
                RotationAnimation on rotation { from: 0; to: -360; duration: 9000; loops: Animation.Infinite }
            }
            Text {
                id: texto
                anchors.centerIn: parent; anchors.verticalCenterOffset: 60
                width: parent.width * 0.8; text: modelData; color: "#eaf6ff"
                font.pixelSize: 22; wrapMode: Text.WordWrap; horizontalAlignment: Text.AlignHCenter
            }
        }
    }
    function onActivate() { apresentacao.currentSlide = 0 }
    function onLeave() {}
}
