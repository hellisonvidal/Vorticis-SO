import QtQuick 2.0
import calamares.slideshow 1.0

Presentation {
    id: apresentacao
    property var textos: [
        "Bem-vindo ao Vorticis SO — leve, bonito e seu.",
        "Apps de Windows, Linux e Android lado a lado: dê dois cliques no instalador e pronto.",
        "Temas animados ou estáticos: a água do tema Maré se adapta à potência do seu computador.",
        "Drivers e firmware atualizados automaticamente no primeiro boot.",
        "Firewall ativo, DNS criptografado e contas com níveis de acesso desde o primeiro minuto."
    ]
    Timer { interval: 6000; running: apresentacao.activatedInCalamares; repeat: true; onTriggered: apresentacao.goToNextSlide() }
    Repeater {
        model: apresentacao.textos
        Slide {
            Rectangle { anchors.fill: parent; gradient: Gradient {
                GradientStop { position: 0.0; color: "#0d78c4" } GradientStop { position: 1.0; color: "#021a3d" } } }
            Text { anchors.centerIn: parent; width: parent.width * 0.8; text: modelData; color: "#eaf6ff";
                   font.pixelSize: 22; wrapMode: Text.WordWrap; horizontalAlignment: Text.AlignHCenter }
        }
    }
    function onActivate() { apresentacao.currentSlide = 0 }
    function onLeave() {}
}
